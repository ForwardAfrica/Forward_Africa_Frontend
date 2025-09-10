const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class VideoCompressionService {
  constructor() {
    // Set FFmpeg path if needed (for production)
    // ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
  }

  /**
   * Compress video file to reduce size while maintaining quality
   * @param {string} inputPath - Path to input video file
   * @param {string} outputPath - Path for compressed video
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} - Compression result
   */
  async compressVideo(inputPath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
      // Check if FFmpeg is available
      try {
        ffmpeg.getAvailableCodecs((err, codecs) => {
          if (err) {
            console.error('❌ FFmpeg not available:', err.message);
            reject(new Error('FFmpeg is not installed or not available on the system'));
            return;
          }
        });
      } catch (ffmpegError) {
        console.error('❌ FFmpeg check failed:', ffmpegError.message);
        reject(new Error('FFmpeg is not installed or not available on the system'));
        return;
      }

      const {
        targetSize = '50MB', // Target file size
        quality = 'medium',   // low, medium, high
        format = 'mp4',       // Output format
        resolution = '1280x720', // Target resolution
        fps = 30,            // Target FPS
        bitrate = '1000k'    // Target bitrate
      } = options;

      // Quality presets
      const qualityPresets = {
        low: {
          resolution: '854x480',
          bitrate: '500k',
          fps: 24
        },
        medium: {
          resolution: '1280x720',
          bitrate: '1000k',
          fps: 30
        },
        high: {
          resolution: '1920x1080',
          bitrate: '2000k',
          fps: 30
        }
      };

      const preset = qualityPresets[quality] || qualityPresets.medium;

      console.log(`🎬 Starting video compression: ${path.basename(inputPath)}`);
      console.log(`📊 Target: ${preset.resolution}, ${preset.bitrate}, ${preset.fps}fps`);

      ffmpeg(inputPath)
        .outputOptions([
          `-c:v libx264`,           // H.264 codec
          `-preset medium`,          // Encoding preset (fast, medium, slow)
          `-crf 23`,                 // Constant Rate Factor (18-28, lower = better quality)
          `-c:a aac`,                // Audio codec
          `-b:a 128k`,               // Audio bitrate
          `-movflags +faststart`,    // Optimize for web streaming
          `-vf scale=${preset.resolution}:force_original_aspect_ratio=decrease`, // Scale video
          `-r ${preset.fps}`,        // Set frame rate
          `-b:v ${preset.bitrate}`,  // Video bitrate
          `-maxrate ${preset.bitrate}`, // Maximum bitrate
          `-bufsize ${preset.bitrate}`, // Buffer size
          `-threads 0`               // Use all CPU cores
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log(`🚀 FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          console.log(`📈 Compression progress: ${progress.percent}% done`);
        })
        .on('end', () => {
          // Get file sizes
          const originalSize = fs.statSync(inputPath).size;
          const compressedSize = fs.statSync(outputPath).size;
          const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

          console.log(`✅ Video compression completed!`);
          console.log(`📊 Original: ${(originalSize / (1024 * 1024)).toFixed(1)}MB`);
          console.log(`📊 Compressed: ${(compressedSize / (1024 * 1024)).toFixed(1)}MB`);
          console.log(`📊 Compression: ${compressionRatio}% reduction`);

          resolve({
            success: true,
            originalSize,
            compressedSize,
            compressionRatio: parseFloat(compressionRatio),
            outputPath
          });
        })
        .on('error', (err) => {
          console.error(`❌ Video compression failed:`, err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Generate thumbnail from video
   * @param {string} videoPath - Path to video file
   * @param {string} thumbnailPath - Path for thumbnail
   * @param {string} timestamp - Timestamp for thumbnail (default: 5 seconds)
   * @returns {Promise<string>} - Thumbnail path
   */
  async generateThumbnail(videoPath, thumbnailPath, timestamp = '00:00:05') {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '320x240'
        })
        .on('end', () => {
          console.log(`🖼️ Thumbnail generated: ${thumbnailPath}`);
          resolve(thumbnailPath);
        })
        .on('error', (err) => {
          console.error(`❌ Thumbnail generation failed:`, err);
          reject(err);
        });
    });
  }

  /**
   * Get video metadata
   * @param {string} videoPath - Path to video file
   * @returns {Promise<Object>} - Video metadata
   */
  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  /**
   * Check if video needs compression based on size and quality
   * @param {string} videoPath - Path to video file
   * @param {number} maxSizeMB - Maximum size in MB
   * @returns {Promise<boolean>} - Whether compression is needed
   */
  async needsCompression(videoPath, maxSizeMB = 50) {
    try {
      const stats = fs.statSync(videoPath);
      const sizeMB = stats.size / (1024 * 1024);

      if (sizeMB <= maxSizeMB) {
        console.log(`✅ Video size (${sizeMB.toFixed(1)}MB) is within limits`);
        return false;
      }

      console.log(`⚠️ Video size (${sizeMB.toFixed(1)}MB) exceeds limit (${maxSizeMB}MB)`);
      return true;
    } catch (error) {
      console.error(`❌ Error checking video size:`, error);
      return true; // Compress if we can't check
    }
  }

  /**
   * Process video upload with compression
   * @param {string} inputPath - Original video path
   * @param {string} outputDir - Output directory
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} - Processing result
   */
  async processVideoUpload(inputPath, outputDir, options = {}) {
    try {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = path.basename(inputPath);
      const nameWithoutExt = path.parse(filename).name;
      const compressedPath = path.join(outputDir, `${nameWithoutExt}_compressed.mp4`);
      const thumbnailPath = path.join(outputDir, `${nameWithoutExt}_thumb.jpg`);

      // Check if compression is needed
      const needsComp = await this.needsCompression(inputPath, options.maxSizeMB || 50);

      let finalVideoPath = inputPath;
      let compressionResult = null;

      if (needsComp) {
        try {
          // Try to compress video
          compressionResult = await this.compressVideo(inputPath, compressedPath, options);
          finalVideoPath = compressedPath;
        } catch (compressionError) {
          console.error('❌ Video compression failed, using original file:', compressionError.message);
          // Fallback to original file if compression fails
          const outputPath = path.join(outputDir, filename);
          fs.copyFileSync(inputPath, outputPath);
          finalVideoPath = outputPath;
        }
      } else {
        // Copy original to output directory
        const outputPath = path.join(outputDir, filename);
        fs.copyFileSync(inputPath, outputPath);
        finalVideoPath = outputPath;
      }

      // Try to generate thumbnail (optional)
      let thumbnailResult = null;
      try {
        thumbnailResult = await this.generateThumbnail(finalVideoPath, thumbnailPath);
      } catch (thumbnailError) {
        console.error('❌ Thumbnail generation failed:', thumbnailError.message);
        // Continue without thumbnail
      }

      // Try to get metadata (optional)
      let metadata = null;
      try {
        metadata = await this.getVideoMetadata(finalVideoPath);
      } catch (metadataError) {
        console.error('❌ Metadata extraction failed:', metadataError.message);
        // Continue without metadata
      }

      return {
        success: true,
        originalPath: inputPath,
        finalPath: finalVideoPath,
        thumbnailPath: thumbnailResult ? thumbnailPath : null,
        compressionResult,
        metadata,
        filename: path.basename(finalVideoPath)
      };

    } catch (error) {
      console.error(`❌ Video processing failed:`, error);
      throw error;
    }
  }
}

module.exports = new VideoCompressionService();