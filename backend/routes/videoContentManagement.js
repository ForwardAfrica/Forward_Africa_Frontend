const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { executeQuery } = require('../lib/database');
const videoProcessingService = require('../services/videoProcessingService');
const contentWorkflowService = require('../services/contentWorkflowService');
const jobProcessorService = require('../services/jobProcessorService');

const router = express.Router();

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/videos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'video-' + uniqueSuffix + ext);
    }
});

const videoFilter = (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only video files are allowed!'), false);
    }
};

const videoUpload = multer({
    storage: videoStorage,
    fileFilter: videoFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    }
});

// Video Upload and Processing Routes

// Upload video for a lesson
router.post('/upload/:lessonId', authenticateToken, authorizeRole(['instructor', 'super_admin', 'content_manager']), videoUpload.single('video'), async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, description, tags, metadata } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        // Verify lesson exists and user has permission
        const [lessons] = await executeQuery(
            'SELECT * FROM lessons WHERE id = ?',
            [lessonId]
        );

        if (lessons.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Process video upload with background jobs
        const result = await jobProcessorService.processVideoUpload(
            lessonId,
            file.path,
            file.originalname
        );

        // Create workflow for the lesson
        const workflowId = await contentWorkflowService.createWorkflow(
            lessonId,
            'lesson',
            req.user.id
        );

        // Add metadata if provided
        if (metadata) {
            const metadataObj = JSON.parse(metadata);
            for (const [key, value] of Object.entries(metadataObj)) {
                await contentWorkflowService.addMetadata(lessonId, 'lesson', {
                    key,
                    value: value.toString(),
                    type: typeof value === 'number' ? 'number' : 'string'
                });
            }
        }

        // Add tags if provided
        if (tags) {
            const tagsArray = JSON.parse(tags);
            await contentWorkflowService.addTags(lessonId, 'lesson', tagsArray);
        }

        res.json({
            success: true,
            videoAssetId: result.videoAssetId,
            jobIds: result.jobs,
            workflowId,
            message: 'Video upload started. Processing jobs have been queued.'
        });
    } catch (error) {
        console.error('Video upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

// Get video processing status
router.get('/status/:videoAssetId', authenticateToken, async (req, res) => {
    try {
        const { videoAssetId } = req.params;

        const status = await videoProcessingService.getVideoProcessingStatus(videoAssetId);
        const jobs = await jobProcessorService.getContentJobs(videoAssetId);

        res.json({
            success: true,
            videoAsset: status.videoAsset,
            transcodings: status.transcodings,
            subtitles: status.subtitles,
            jobs
        });
    } catch (error) {
        console.error('Error getting video status:', error);
        res.status(500).json({ error: 'Failed to get video status' });
    }
});

// Get available video qualities
router.get('/qualities/:videoAssetId', authenticateToken, async (req, res) => {
    try {
        const { videoAssetId } = req.params;
        const qualities = await videoProcessingService.getAvailableQualities(videoAssetId);

        res.json({
            success: true,
            qualities
        });
    } catch (error) {
        console.error('Error getting video qualities:', error);
        res.status(500).json({ error: 'Failed to get video qualities' });
    }
});

// Get subtitles for video
router.get('/subtitles/:videoAssetId', authenticateToken, async (req, res) => {
    try {
        const { videoAssetId } = req.params;
        const { language = 'en', format = 'srt' } = req.query;

        const subtitles = await videoProcessingService.getSubtitles(videoAssetId, language, format);

        if (!subtitles) {
            return res.status(404).json({ error: 'Subtitles not found' });
        }

        res.json({
            success: true,
            subtitles
        });
    } catch (error) {
        console.error('Error getting subtitles:', error);
        res.status(500).json({ error: 'Failed to get subtitles' });
    }
});

// Content Workflow Management Routes

// Get workflow for content
router.get('/workflow/:contentType/:contentId', authenticateToken, async (req, res) => {
    try {
        const { contentType, contentId } = req.params;
        const workflow = await contentWorkflowService.getWorkflow(contentId, contentType);

        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        res.json({
            success: true,
            workflow
        });
    } catch (error) {
        console.error('Error getting workflow:', error);
        res.status(500).json({ error: 'Failed to get workflow' });
    }
});

// Update workflow status
router.put('/workflow/:workflowId/status', authenticateToken, authorizeRole(['instructor', 'super_admin', 'content_manager', 'community_manager']), async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { status, notes } = req.body;

        const result = await contentWorkflowService.updateWorkflowStatus(
            workflowId,
            status,
            req.user.id,
            notes
        );

        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error updating workflow status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Assign reviewer
router.post('/workflow/:workflowId/assign-reviewer', authenticateToken, authorizeRole(['super_admin', 'content_manager']), async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { reviewerId, deadline } = req.body;

        const result = await contentWorkflowService.assignReviewer(
            workflowId,
            reviewerId,
            req.user.id,
            deadline
        );

        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error assigning reviewer:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add review notes
router.post('/workflow/:workflowId/review-notes', authenticateToken, async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { notes } = req.body;

        const result = await contentWorkflowService.addReviewNotes(
            workflowId,
            req.user.id,
            notes
        );

        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error adding review notes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get content by workflow status
router.get('/workflow/status/:status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.params;
        const { contentType, limit = 50, offset = 0 } = req.query;

        const content = await contentWorkflowService.getContentByStatus(
            status,
            contentType,
            parseInt(limit),
            parseInt(offset)
        );

        res.json({
            success: true,
            content
        });
    } catch (error) {
        console.error('Error getting content by status:', error);
        res.status(500).json({ error: 'Failed to get content' });
    }
});

// Get pending reviews for current user
router.get('/workflow/pending-reviews', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const reviews = await contentWorkflowService.getPendingReviews(
            req.user.id,
            parseInt(limit),
            parseInt(offset)
        );

        res.json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error('Error getting pending reviews:', error);
        res.status(500).json({ error: 'Failed to get pending reviews' });
    }
});

// Metadata Management Routes

// Add metadata to content
router.post('/metadata/:contentType/:contentId', authenticateToken, authorizeRole(['instructor', 'super_admin', 'content_manager']), async (req, res) => {
    try {
        const { contentType, contentId } = req.params;
        const { metadata } = req.body;

        const metadataId = await contentWorkflowService.addMetadata(
            contentId,
            contentType,
            metadata
        );

        res.json({
            success: true,
            metadataId
        });
    } catch (error) {
        console.error('Error adding metadata:', error);
        res.status(500).json({ error: 'Failed to add metadata' });
    }
});

// Update metadata
router.put('/metadata/:metadataId', authenticateToken, authorizeRole(['instructor', 'super_admin', 'content_manager']), async (req, res) => {
    try {
        const { metadataId } = req.params;
        const { metadata } = req.body;

        const result = await contentWorkflowService.updateMetadata(metadataId, metadata);

        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error updating metadata:', error);
        res.status(500).json({ error: 'Failed to update metadata' });
    }
});

// Get content metadata
router.get('/metadata/:contentType/:contentId', authenticateToken, async (req, res) => {
    try {
        const { contentType, contentId } = req.params;
        const { includePrivate = false } = req.query;

        const metadata = await contentWorkflowService.getContentMetadata(
            contentId,
            contentType,
            includePrivate === 'true'
        );

        res.json({
            success: true,
            metadata
        });
    } catch (error) {
        console.error('Error getting metadata:', error);
        res.status(500).json({ error: 'Failed to get metadata' });
    }
});

// Tag Management Routes

// Add tags to content
router.post('/tags/:contentType/:contentId', authenticateToken, authorizeRole(['instructor', 'super_admin', 'content_manager']), async (req, res) => {
    try {
        const { contentType, contentId } = req.params;
        const { tags } = req.body;

        const tagIds = await contentWorkflowService.addTags(
            contentId,
            contentType,
            tags
        );

        res.json({
            success: true,
            tagIds
        });
    } catch (error) {
        console.error('Error adding tags:', error);
        res.status(500).json({ error: 'Failed to add tags' });
    }
});

// Get content tags
router.get('/tags/:contentType/:contentId', authenticateToken, async (req, res) => {
    try {
        const { contentType, contentId } = req.params;

        const tags = await contentWorkflowService.getContentTags(contentId, contentType);

        res.json({
            success: true,
            tags
        });
    } catch (error) {
        console.error('Error getting tags:', error);
        res.status(500).json({ error: 'Failed to get tags' });
    }
});

// Search content by metadata and tags
router.post('/search', authenticateToken, async (req, res) => {
    try {
        const { searchParams } = req.body;

        const results = await contentWorkflowService.searchContentByMetadata(searchParams);

        res.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('Error searching content:', error);
        res.status(500).json({ error: 'Failed to search content' });
    }
});

// Job Management Routes

// Get job status
router.get('/jobs/:jobId', authenticateToken, async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await jobProcessorService.getJobStatus(jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({
            success: true,
            job
        });
    } catch (error) {
        console.error('Error getting job status:', error);
        res.status(500).json({ error: 'Failed to get job status' });
    }
});

// Get all jobs for content
router.get('/jobs/content/:contentId', authenticateToken, async (req, res) => {
    try {
        const { contentId } = req.params;
        const { jobType } = req.query;

        const jobs = await jobProcessorService.getContentJobs(contentId, jobType);

        res.json({
            success: true,
            jobs
        });
    } catch (error) {
        console.error('Error getting content jobs:', error);
        res.status(500).json({ error: 'Failed to get content jobs' });
    }
});

// Retry failed job
router.post('/jobs/:jobId/retry', authenticateToken, authorizeRole(['super_admin', 'content_manager']), async (req, res) => {
    try {
        const { jobId } = req.params;

        const result = await jobProcessorService.retryFailedJob(jobId);

        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error retrying job:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get queue statistics
router.get('/jobs/queue/stats', authenticateToken, authorizeRole(['super_admin', 'content_manager']), async (req, res) => {
    try {
        const stats = await jobProcessorService.getQueueStatistics();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting queue stats:', error);
        res.status(500).json({ error: 'Failed to get queue statistics' });
    }
});

// Workflow Statistics Routes

// Get workflow statistics
router.get('/workflow/stats', authenticateToken, authorizeRole(['super_admin', 'content_manager']), async (req, res) => {
    try {
        const stats = await contentWorkflowService.getWorkflowStatistics();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting workflow stats:', error);
        res.status(500).json({ error: 'Failed to get workflow statistics' });
    }
});

// Get overdue reviews
router.get('/workflow/overdue-reviews', authenticateToken, authorizeRole(['super_admin', 'content_manager']), async (req, res) => {
    try {
        const overdue = await contentWorkflowService.getOverdueReviews();

        res.json({
            success: true,
            overdue
        });
    } catch (error) {
        console.error('Error getting overdue reviews:', error);
        res.status(500).json({ error: 'Failed to get overdue reviews' });
    }
});

// Get workflow timeline
router.get('/workflow/:workflowId/timeline', authenticateToken, async (req, res) => {
    try {
        const { workflowId } = req.params;

        const timeline = await contentWorkflowService.getWorkflowTimeline(workflowId);

        res.json({
            success: true,
            timeline
        });
    } catch (error) {
        console.error('Error getting workflow timeline:', error);
        res.status(500).json({ error: 'Failed to get workflow timeline' });
    }
});

// Bulk operations
router.post('/workflow/bulk-update', authenticateToken, authorizeRole(['super_admin', 'content_manager']), async (req, res) => {
    try {
        const { contentIds, contentType, newStatus, notes } = req.body;

        const results = await contentWorkflowService.bulkUpdateStatus(
            contentIds,
            contentType,
            newStatus,
            req.user.id,
            notes
        );

        res.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('Error bulk updating status:', error);
        res.status(500).json({ error: 'Failed to bulk update status' });
    }
});

module.exports = router;