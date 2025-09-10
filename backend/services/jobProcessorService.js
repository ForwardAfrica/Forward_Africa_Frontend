const Bull = require('bull');
const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../lib/database');
const videoProcessingService = require('./videoProcessingService');
const contentWorkflowService = require('./contentWorkflowService');

class JobProcessorService {
    constructor() {
        // Check if Redis is enabled via environment variable first
        if (process.env.REDIS_ENABLED === 'false') {
            console.log('⚠️ Redis disabled via environment variable, running in fallback mode');
            this.redisAvailable = false;
            this.videoTranscodingQueue = null;
            this.subtitleGenerationQueue = null;
            this.metadataExtractionQueue = null;
            this.thumbnailGenerationQueue = null;
            return;
        }

        // Initialize Redis connection for job queues
        this.redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || null
        };

        // Initialize queues as null
        this.videoTranscodingQueue = null;
        this.subtitleGenerationQueue = null;
        this.metadataExtractionQueue = null;
        this.thumbnailGenerationQueue = null;
        this.redisAvailable = false;

        // Try to initialize Redis queues
        this.initializeQueues();
    }

    initializeQueues() {
        // Check if Redis is enabled via environment variable
        if (process.env.REDIS_ENABLED === 'false') {
            console.log('⚠️ Redis disabled via environment variable, running in fallback mode');
            this.redisAvailable = false;
            return;
        }

        // Check if we should skip Redis initialization
        if (!this.redisAvailable) {
            return;
        }

        try {
            // Create job queues
            this.videoTranscodingQueue = new Bull('video-transcoding', {
                redis: this.redisConfig,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000
                    },
                    removeOnComplete: 100,
                    removeOnFail: 50
                }
            });

            this.subtitleGenerationQueue = new Bull('subtitle-generation', {
                redis: this.redisConfig,
                defaultJobOptions: {
                    attempts: 2,
                    backoff: {
                        type: 'exponential',
                        delay: 5000
                    },
                    removeOnComplete: 100,
                    removeOnFail: 50
                }
            });

            this.metadataExtractionQueue = new Bull('metadata-extraction', {
                redis: this.redisConfig,
                defaultJobOptions: {
                    attempts: 2,
                    backoff: {
                        type: 'exponential',
                        delay: 3000
                    },
                    removeOnComplete: 100,
                    removeOnFail: 50
                }
            });

            this.thumbnailGenerationQueue = new Bull('thumbnail-generation', {
                redis: this.redisConfig,
                defaultJobOptions: {
                    attempts: 2,
                    backoff: {
                        type: 'exponential',
                        delay: 2000
                    },
                    removeOnComplete: 100,
                    removeOnFail: 50
                }
            });

            this.redisAvailable = true;
            this.setupQueueProcessors();
            this.setupQueueEventListeners();
            console.log('✅ Redis queues initialized successfully');
        } catch (error) {
            console.warn('⚠️ Redis not available, running in fallback mode:', error.message);
            this.redisAvailable = false;
        }
    }

    // Setup queue processors
    setupQueueProcessors() {
        if (!this.redisAvailable) return;

        // Video transcoding processor
        this.videoTranscodingQueue.process(async (job) => {
            try {
                const { videoAssetId, originalPath, resolutions } = job.data;

                console.log(`Processing video transcoding job for asset: ${videoAssetId}`);

                // Update job status in database
                await this.updateJobStatus(job.id.toString(), 'processing', 0);

                const transcodingJobIds = await videoProcessingService.transcodeVideo(
                    videoAssetId,
                    originalPath,
                    resolutions
                );

                // Update job status to completed
                await this.updateJobStatus(job.id.toString(), 'completed', 100, {
                    transcodingJobIds,
                    processedResolutions: resolutions.length
                });

                return { success: true, transcodingJobIds };
            } catch (error) {
                console.error('Video transcoding job failed:', error);
                await this.updateJobStatus(job.id.toString(), 'failed', 0, null, error.message);
                throw error;
            }
        });

        // Subtitle generation processor
        this.subtitleGenerationQueue.process(async (job) => {
            try {
                const { videoAssetId, videoPath, language } = job.data;

                console.log(`Processing subtitle generation job for asset: ${videoAssetId}`);

                await this.updateJobStatus(job.id.toString(), 'processing', 0);

                const subtitleId = await videoProcessingService.generateSubtitles(
                    videoAssetId,
                    videoPath,
                    language
                );

                await this.updateJobStatus(job.id.toString(), 'completed', 100, {
                    subtitleId,
                    language
                });

                return { success: true, subtitleId };
            } catch (error) {
                console.error('Subtitle generation job failed:', error);
                await this.updateJobStatus(job.id.toString(), 'failed', 0, null, error.message);
                throw error;
            }
        });

        // Metadata extraction processor
        this.metadataExtractionQueue.process(async (job) => {
            try {
                const { videoAssetId, videoPath } = job.data;

                console.log(`Processing metadata extraction job for asset: ${videoAssetId}`);

                await this.updateJobStatus(job.id.toString(), 'processing', 0);

                const metadata = await videoProcessingService.extractVideoMetadata(videoPath);

                // Update video asset with extracted metadata
                await executeQuery(
                    `UPDATE video_assets
                     SET original_duration = ?, original_bitrate = ?, original_resolution = ?,
                         original_format = ?, updated_at = NOW()
                     WHERE id = ?`,
                    [metadata.duration, metadata.bitrate, metadata.resolution, metadata.format, videoAssetId]
                );

                await this.updateJobStatus(job.id.toString(), 'completed', 100, metadata);

                return { success: true, metadata };
            } catch (error) {
                console.error('Metadata extraction job failed:', error);
                await this.updateJobStatus(job.id.toString(), 'failed', 0, null, error.message);
                throw error;
            }
        });

        // Thumbnail generation processor
        this.thumbnailGenerationQueue.process(async (job) => {
            try {
                const { videoAssetId, videoPath, timeOffset } = job.data;

                console.log(`Processing thumbnail generation job for asset: ${videoAssetId}`);

                await this.updateJobStatus(job.id.toString(), 'processing', 0);

                const thumbnailPath = await videoProcessingService.generateThumbnail(
                    videoPath,
                    videoAssetId,
                    timeOffset
                );

                await this.updateJobStatus(job.id.toString(), 'completed', 100, {
                    thumbnailPath
                });

                return { success: true, thumbnailPath };
            } catch (error) {
                console.error('Thumbnail generation job failed:', error);
                await this.updateJobStatus(job.id.toString(), 'failed', 0, null, error.message);
                throw error;
            }
        });

        // Setup queue event listeners
        this.setupQueueEventListeners();
    }

    // Setup queue event listeners
    setupQueueEventListeners() {
        if (!this.redisAvailable) return;

        const queues = [
            this.videoTranscodingQueue,
            this.subtitleGenerationQueue,
            this.metadataExtractionQueue,
            this.thumbnailGenerationQueue
        ];

        queues.forEach(queue => {
            queue.on('completed', (job, result) => {
                console.log(`Job ${job.id} completed successfully`);
            });

            queue.on('failed', (job, err) => {
                console.error(`Job ${job.id} failed:`, err.message);
            });

            queue.on('stalled', (job) => {
                console.warn(`Job ${job.id} stalled`);
            });

            queue.on('error', (error) => {
                console.error('Queue error:', error);
            });
        });
    }

    // Add video transcoding job
    async addVideoTranscodingJob(videoAssetId, originalPath, resolutions, priority = 5) {
        const jobId = uuidv4();

        // Create job record in database
        await executeQuery(
            `INSERT INTO processing_jobs (id, job_type, content_id, priority, status, parameters)
             VALUES (?, 'video_transcoding', ?, ?, 'pending', ?)`,
            [jobId, videoAssetId, priority, JSON.stringify({ resolutions })]
        );

        if (!this.redisAvailable) {
            console.log('Redis not available, processing video transcoding synchronously');
            // Process synchronously as fallback
            try {
                await this.updateJobStatus(jobId, 'processing', 0);
                const transcodingJobIds = await videoProcessingService.transcodeVideo(
                    videoAssetId,
                    originalPath,
                    resolutions
                );
                await this.updateJobStatus(jobId, 'completed', 100, { transcodingJobIds });
                return { jobId, queueJobId: null, processed: true };
            } catch (error) {
                console.error('Synchronous video transcoding failed:', error);
                await this.updateJobStatus(jobId, 'failed', 0, null, error.message);
                throw error;
            }
        }

        // Add job to queue
        const job = await this.videoTranscodingQueue.add(
            'transcode',
            { videoAssetId, originalPath, resolutions },
            {
                jobId: jobId,
                priority: priority,
                delay: 0
            }
        );

        return { jobId, queueJobId: job.id };
    }

    // Add subtitle generation job
    async addSubtitleGenerationJob(videoAssetId, videoPath, language = 'en', priority = 5) {
        const jobId = uuidv4();

        await executeQuery(
            `INSERT INTO processing_jobs (id, job_type, content_id, priority, status, parameters)
             VALUES (?, 'subtitle_generation', ?, ?, 'pending', ?)`,
            [jobId, videoAssetId, priority, JSON.stringify({ language })]
        );

        const job = await this.subtitleGenerationQueue.add(
            'generate',
            { videoAssetId, videoPath, language },
            {
                jobId: jobId,
                priority: priority,
                delay: 0
            }
        );

        return { jobId, queueJobId: job.id };
    }

    // Add metadata extraction job
    async addMetadataExtractionJob(videoAssetId, videoPath, priority = 3) {
        const jobId = uuidv4();

        await executeQuery(
            `INSERT INTO processing_jobs (id, job_type, content_id, priority, status, parameters)
             VALUES (?, 'metadata_extraction', ?, ?, 'pending', ?)`,
            [jobId, videoAssetId, priority, JSON.stringify({})]
        );

        const job = await this.metadataExtractionQueue.add(
            'extract',
            { videoAssetId, videoPath },
            {
                jobId: jobId,
                priority: priority,
                delay: 0
            }
        );

        return { jobId, queueJobId: job.id };
    }

    // Add thumbnail generation job
    async addThumbnailGenerationJob(videoAssetId, videoPath, timeOffset = '00:00:05', priority = 4) {
        const jobId = uuidv4();

        await executeQuery(
            `INSERT INTO processing_jobs (id, job_type, content_id, priority, status, parameters)
             VALUES (?, 'thumbnail_generation', ?, ?, 'pending', ?)`,
            [jobId, videoAssetId, priority, JSON.stringify({ timeOffset })]
        );

        const job = await this.thumbnailGenerationQueue.add(
            'generate',
            { videoAssetId, videoPath, timeOffset },
            {
                jobId: jobId,
                priority: priority,
                delay: 0
            }
        );

        return { jobId, queueJobId: job.id };
    }

    // Process video upload with all jobs
    async processVideoUpload(lessonId, filePath, originalFilename) {
        const videoAssetId = uuidv4();

        try {
            // Create video asset record
            await executeQuery(
                `INSERT INTO video_assets (id, lesson_id, original_filename, original_path, upload_status)
                 VALUES (?, ?, ?, ?, 'uploaded')`,
                [videoAssetId, lessonId, originalFilename, filePath]
            );

            // Add all processing jobs
            const jobs = await Promise.all([
                this.addMetadataExtractionJob(videoAssetId, filePath, 1), // Highest priority
                this.addThumbnailGenerationJob(videoAssetId, filePath, '00:00:05', 2),
                this.addVideoTranscodingJob(videoAssetId, filePath, [
                    { resolution: '1920x1080', quality: 'high', bitrate: 5000 },
                    { resolution: '1280x720', quality: 'medium', bitrate: 2500 },
                    { resolution: '854x480', quality: 'low', bitrate: 1000 }
                ], 3),
                this.addSubtitleGenerationJob(videoAssetId, filePath, 'en', 4)
            ]);

            return {
                videoAssetId,
                jobs: jobs.map(job => job.jobId)
            };
        } catch (error) {
            console.error('Error processing video upload:', error);
            throw error;
        }
    }

    // Update job status in database
    async updateJobStatus(jobId, status, progress, resultData = null, errorMessage = null) {
        await executeQuery(
            `UPDATE processing_jobs
             SET status = ?, progress = ?, result_data = ?, error_message = ?,
                 started_at = CASE WHEN ? = 'processing' THEN NOW() ELSE started_at END,
                 completed_at = CASE WHEN ? IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
                 updated_at = NOW()
             WHERE id = ?`,
            [status, progress, JSON.stringify(resultData), errorMessage, status, status, jobId]
        );
    }

    // Get job status
    async getJobStatus(jobId) {
        const [jobs] = await executeQuery(
            'SELECT * FROM processing_jobs WHERE id = ?',
            [jobId]
        );

        return jobs[0] || null;
    }

    // Get all jobs for a content item
    async getContentJobs(contentId, jobType = null) {
        let query = 'SELECT * FROM processing_jobs WHERE content_id = ?';
        const params = [contentId];

        if (jobType) {
            query += ' AND job_type = ?';
            params.push(jobType);
        }

        query += ' ORDER BY created_at DESC';

        const [jobs] = await executeQuery(query, params);
        return jobs;
    }

    // Get queue statistics
    async getQueueStatistics() {
        const stats = {};

        const queues = [
            { name: 'video-transcoding', queue: this.videoTranscodingQueue },
            { name: 'subtitle-generation', queue: this.subtitleGenerationQueue },
            { name: 'metadata-extraction', queue: this.metadataExtractionQueue },
            { name: 'thumbnail-generation', queue: this.thumbnailGenerationQueue }
        ];

        for (const { name, queue } of queues) {
            const [waiting, active, completed, failed] = await Promise.all([
                queue.getWaiting(),
                queue.getActive(),
                queue.getCompleted(),
                queue.getFailed()
            ]);

            stats[name] = {
                waiting: waiting.length,
                active: active.length,
                completed: completed.length,
                failed: failed.length
            };
        }

        return stats;
    }

    // Clean up completed jobs
    async cleanupCompletedJobs(daysToKeep = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        await executeQuery(
            'DELETE FROM processing_jobs WHERE status IN (?, ?) AND completed_at < ?',
            ['completed', 'failed', cutoffDate]
        );
    }

    // Retry failed jobs
    async retryFailedJob(jobId) {
        const [jobs] = await executeQuery(
            'SELECT * FROM processing_jobs WHERE id = ? AND status = ?',
            [jobId, 'failed']
        );

        if (jobs.length === 0) {
            throw new Error('Job not found or not failed');
        }

        const job = jobs[0];

        // Reset job status
        await executeQuery(
            'UPDATE processing_jobs SET status = ?, retry_count = retry_count + 1, updated_at = NOW() WHERE id = ?',
            ['pending', jobId]
        );

        // Re-add to appropriate queue
        const jobData = JSON.parse(job.parameters || '{}');

        switch (job.job_type) {
            case 'video_transcoding':
                return await this.addVideoTranscodingJob(job.content_id, jobData.originalPath, jobData.resolutions, job.priority);
            case 'subtitle_generation':
                return await this.addSubtitleGenerationJob(job.content_id, jobData.videoPath, jobData.language, job.priority);
            case 'metadata_extraction':
                return await this.addMetadataExtractionJob(job.content_id, jobData.videoPath, job.priority);
            case 'thumbnail_generation':
                return await this.addThumbnailGenerationJob(job.content_id, jobData.videoPath, jobData.timeOffset, job.priority);
            default:
                throw new Error(`Unknown job type: ${job.job_type}`);
        }
    }

    // Graceful shutdown
    async shutdown() {
        await Promise.all([
            this.videoTranscodingQueue.close(),
            this.subtitleGenerationQueue.close(),
            this.metadataExtractionQueue.close(),
            this.thumbnailGenerationQueue.close()
        ]);
    }
}

module.exports = new JobProcessorService();