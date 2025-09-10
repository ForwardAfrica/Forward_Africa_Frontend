const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const { executeQuery } = require('../lib/database');
const sharp = require('sharp');

// Configure ffmpeg path (you may need to install ffmpeg on your system)
// ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
// ffmpeg.setFfprobePath('/usr/bin/ffprobe');

class VideoProcessingService {
    constructor() {
        this.uploadDir = path.join(__dirname, '../uploads');
        this.videoDir = path.join(this.uploadDir, 'videos');
        this.transcodedDir = path.join(this.uploadDir, 'transcoded');
        this.subtitlesDir = path.join(this.uploadDir, 'subtitles');
        this.thumbnailsDir = path.join(this.uploadDir, 'thumbnails');

        // Create directories if they don't exist
        [this.videoDir, this.transcodedDir, this.subtitlesDir, this.thumbnailsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // Extract video metadata using ffprobe
    async extractVideoMetadata(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

                const videoInfo = {
                    duration: Math.round(metadata.format.duration),
                    size: metadata.format.size,
                    bitrate: Math.round(metadata.format.bit_rate / 1000), // Convert to kbps
                    format: metadata.format.format_name,
                    resolution: `${videoStream?.width}x${videoStream?.height}`,
                    videoCodec: videoStream?.codec_name,
                    audioCodec: audioStream?.codec_name,
                    frameRate: videoStream?.r_frame_rate,
                    audioChannels: audioStream?.channels,
                    audioSampleRate: audioStream?.sample_rate
                };

                resolve(videoInfo);
            });
        });
    }

    // Transcode video to multiple resolutions
    async transcodeVideo(videoAssetId, originalPath, resolutions = [
        { resolution: '1920x1080', quality: 'high', bitrate: 5000 },
        { resolution: '1280x720', quality: 'medium', bitrate: 2500 },
        { resolution: '854x480', quality: 'low', bitrate: 1000 }
    ]) {
        const transcodingJobs = [];

        for (const config of resolutions) {
            const jobId = uuidv4();
            const outputPath = path.join(this.transcodedDir, `${videoAssetId}_${config.resolution}.mp4`);

            // Create transcoding record
            await executeQuery(
                `INSERT INTO video_transcodings (id, video_asset_id, resolution, quality, format, file_path, status)
                 VALUES (?, ?, ?, ?, 'mp4', ?, 'pending')`,
                [jobId, videoAssetId, config.resolution, config.quality, outputPath]
            );

            transcodingJobs.push({
                jobId,
                inputPath: originalPath,
                outputPath,
                config
            });
        }

        // Process transcoding jobs
        for (const job of transcodingJobs) {
            await this.processTranscodingJob(job);
        }

        return transcodingJobs.map(job => job.jobId);
    }

    // Process individual transcoding job
    async processTranscodingJob(job) {
        const { jobId, inputPath, outputPath, config } = job;

        try {
            // Update job status to processing
            await executeQuery(
                'UPDATE video_transcodings SET status = ?, processing_started_at = NOW() WHERE id = ?',
                ['processing', jobId]
            );

            return new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .outputOptions([
                        `-c:v libx264`,
                        `-preset medium`,
                        `-crf 23`,
                        `-c:a aac`,
                        `-b:a 128k`,
                        `-movflags +faststart`,
                        `-vf scale=${config.resolution}`,
                        `-b:v ${config.bitrate}k`
                    ])
                    .output(outputPath)
                    .on('start', async (commandLine) => {
                        console.log(`Started transcoding job ${jobId}: ${commandLine}`);
                    })
                    .on('progress', async (progress) => {
                        const percent = Math.round(progress.percent || 0);
                        await executeQuery(
                            'UPDATE video_transcodings SET progress = ? WHERE id = ?',
                            [percent, jobId]
                        );
                    })
                    .on('end', async () => {
                        try {
                            // Get file size
                            const stats = fs.statSync(outputPath);

                            // Update job as completed
                            await executeQuery(
                                `UPDATE video_transcodings
                                 SET status = ?, file_size = ?, processing_completed_at = NOW(), progress = 100
                                 WHERE id = ?`,
                                ['completed', stats.size, jobId]
                            );

                            console.log(`Transcoding completed for job ${jobId}`);
                            resolve(jobId);
                        } catch (error) {
                            reject(error);
                        }
                    })
                    .on('error', async (err) => {
                        console.error(`Transcoding error for job ${jobId}:`, err);

                        await executeQuery(
                            'UPDATE video_transcodings SET status = ?, error_message = ? WHERE id = ?',
                            ['failed', err.message, jobId]
                        );

                        reject(err);
                    })
                    .run();
            });
        } catch (error) {
            await executeQuery(
                'UPDATE video_transcodings SET status = ?, error_message = ? WHERE id = ?',
                ['failed', error.message, jobId]
            );
            throw error;
        }
    }

    // Generate subtitles using speech recognition
    async generateSubtitles(videoAssetId, videoPath, language = 'en') {
        const subtitleId = uuidv4();
        const subtitlePath = path.join(this.subtitlesDir, `${videoAssetId}_${language}.srt`);

        try {
            // Create subtitle record
            await executeQuery(
                `INSERT INTO subtitles (id, video_asset_id, language, format, file_path, status)
                 VALUES (?, ?, ?, 'srt', ?, 'processing')`,
                [subtitleId, videoAssetId, language, subtitlePath]
            );

            // Extract audio for speech recognition
            const audioPath = path.join(this.subtitlesDir, `${videoAssetId}_audio.wav`);

            await this.extractAudio(videoPath, audioPath);

            // Generate subtitles using Google Speech-to-Text (you'll need to configure credentials)
            const subtitles = await this.performSpeechRecognition(audioPath, language);

            // Save subtitles to file
            await this.saveSubtitlesToFile(subtitlePath, subtitles);

            // Save subtitle segments to database
            await this.saveSubtitleSegments(subtitleId, subtitles);

            // Update subtitle record
            await executeQuery(
                `UPDATE subtitles
                 SET status = ?, confidence_score = ?, word_count = ?, processing_completed_at = NOW()
                 WHERE id = ?`,
                ['completed', this.calculateAverageConfidence(subtitles), this.countWords(subtitles), subtitleId]
            );

            // Clean up temporary audio file
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }

            return subtitleId;
        } catch (error) {
            await executeQuery(
                'UPDATE subtitles SET status = ?, error_message = ? WHERE id = ?',
                ['failed', error.message, subtitleId]
            );
            throw error;
        }
    }

    // Extract audio from video
    async extractAudio(videoPath, audioPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .outputOptions([
                    '-vn',
                    '-acodec pcm_s16le',
                    '-ar 16000',
                    '-ac 1'
                ])
                .output(audioPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });
    }

    // Perform speech recognition (placeholder - implement with your preferred service)
    async performSpeechRecognition(audioPath, language) {
        // This is a placeholder implementation
        // You should integrate with Google Speech-to-Text, AWS Transcribe, or similar service

        // For now, return mock subtitles
        return [
            {
                start: 0.0,
                end: 5.0,
                text: "Welcome to this comprehensive course on business fundamentals.",
                confidence: 0.95
            },
            {
                start: 5.0,
                end: 10.0,
                text: "Today we will be covering the essential principles that every entrepreneur needs to understand.",
                confidence: 0.92
            },
            {
                start: 10.0,
                end: 15.0,
                text: "Let us start with the basics of market analysis and customer segmentation.",
                confidence: 0.94
            }
        ];
    }

    // Save subtitles to SRT file
    async saveSubtitlesToFile(filePath, subtitles) {
        let srtContent = '';

        subtitles.forEach((subtitle, index) => {
            const startTime = this.formatTime(subtitle.start);
            const endTime = this.formatTime(subtitle.end);

            srtContent += `${index + 1}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            srtContent += `${subtitle.text}\n\n`;
        });

        fs.writeFileSync(filePath, srtContent);
    }

    // Save subtitle segments to database
    async saveSubtitleSegments(subtitleId, subtitles) {
        for (let i = 0; i < subtitles.length; i++) {
            const subtitle = subtitles[i];
            await executeQuery(
                `INSERT INTO subtitle_segments (id, subtitle_id, start_time, end_time, text, confidence, segment_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), subtitleId, subtitle.start, subtitle.end, subtitle.text, subtitle.confidence, i + 1]
            );
        }
    }

    // Generate video thumbnail
    async generateThumbnail(videoPath, videoAssetId, timeOffset = '00:00:05') {
        const thumbnailPath = path.join(this.thumbnailsDir, `${videoAssetId}_thumb.jpg`);

        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: [timeOffset],
                    filename: path.basename(thumbnailPath),
                    folder: path.dirname(thumbnailPath),
                    size: '1280x720'
                })
                .on('end', () => resolve(thumbnailPath))
                .on('error', (err) => reject(err));
        });
    }

    // Process video upload
    async processVideoUpload(lessonId, filePath, originalFilename) {
        const videoAssetId = uuidv4();

        try {
            // Extract video metadata
            const metadata = await this.extractVideoMetadata(filePath);

            // Create video asset record
            await executeQuery(
                `INSERT INTO video_assets (id, lesson_id, original_filename, original_path, original_size,
                 original_duration, original_format, original_resolution, original_bitrate, upload_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'uploaded')`,
                [videoAssetId, lessonId, originalFilename, filePath, metadata.size, metadata.duration,
                 metadata.format, metadata.resolution, metadata.bitrate]
            );

            // Start transcoding process
            const transcodingJobIds = await this.transcodeVideo(videoAssetId, filePath);

            // Generate subtitles
            const subtitleId = await this.generateSubtitles(videoAssetId, filePath);

            // Generate thumbnail
            const thumbnailPath = await this.generateThumbnail(filePath, videoAssetId);

            // Update video asset status
            await executeQuery(
                'UPDATE video_assets SET processing_status = ? WHERE id = ?',
                ['completed', videoAssetId]
            );

            return {
                videoAssetId,
                transcodingJobIds,
                subtitleId,
                thumbnailPath,
                metadata
            };
        } catch (error) {
            await executeQuery(
                'UPDATE video_assets SET processing_status = ? WHERE id = ?',
                ['failed', videoAssetId]
            );
            throw error;
        }
    }

    // Get video processing status
    async getVideoProcessingStatus(videoAssetId) {
        const [videoAsset] = await executeQuery(
            'SELECT * FROM video_assets WHERE id = ?',
            [videoAssetId]
        );

        const [transcodings] = await executeQuery(
            'SELECT * FROM video_transcodings WHERE video_asset_id = ?',
            [videoAssetId]
        );

        const [subtitles] = await executeQuery(
            'SELECT * FROM subtitles WHERE video_asset_id = ?',
            [videoAssetId]
        );

        return {
            videoAsset: videoAsset[0],
            transcodings,
            subtitles
        };
    }

    // Utility methods
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }

    calculateAverageConfidence(subtitles) {
        if (subtitles.length === 0) return 0;
        const total = subtitles.reduce((sum, subtitle) => sum + subtitle.confidence, 0);
        return total / subtitles.length;
    }

    countWords(subtitles) {
        return subtitles.reduce((count, subtitle) => {
            return count + subtitle.text.split(' ').length;
        }, 0);
    }

    // Get available video qualities for a video asset
    async getAvailableQualities(videoAssetId) {
        const [transcodings] = await executeQuery(
            'SELECT resolution, quality, format, file_path, file_size FROM video_transcodings WHERE video_asset_id = ? AND status = ?',
            [videoAssetId, 'completed']
        );

        return transcodings;
    }

    // Get subtitles for a video asset
    async getSubtitles(videoAssetId, language = 'en', format = 'srt') {
        const [subtitles] = await executeQuery(
            'SELECT * FROM subtitles WHERE video_asset_id = ? AND language = ? AND format = ? AND status = ?',
            [videoAssetId, language, format, 'completed']
        );

        if (subtitles.length === 0) {
            return null;
        }

        const [segments] = await executeQuery(
            'SELECT * FROM subtitle_segments WHERE subtitle_id = ? ORDER BY segment_order',
            [subtitles[0].id]
        );

        return {
            subtitle: subtitles[0],
            segments
        };
    }
}

module.exports = new VideoProcessingService();