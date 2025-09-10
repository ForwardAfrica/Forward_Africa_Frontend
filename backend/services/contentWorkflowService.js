const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../lib/database');

class ContentWorkflowService {
    constructor() {
        this.workflowStates = {
            DRAFT: 'draft',
            REVIEW: 'review',
            APPROVED: 'approved',
            PUBLISHED: 'published',
            ARCHIVED: 'archived'
        };

        this.contentTypes = {
            COURSE: 'course',
            LESSON: 'lesson',
            VIDEO: 'video'
        };
    }

    // Create workflow for content
    async createWorkflow(contentId, contentType, createdBy) {
        const workflowId = uuidv4();

        await executeQuery(
            `INSERT INTO content_workflow (id, content_id, content_type, status, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [workflowId, contentId, contentType, this.workflowStates.DRAFT]
        );

        // Create initial workflow history
        await executeQuery(
            `INSERT INTO workflow_history (id, workflow_id, to_status, changed_by, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [uuidv4(), workflowId, this.workflowStates.DRAFT, createdBy, 'Content created']
        );

        return workflowId;
    }

    // Get workflow by content ID
    async getWorkflow(contentId, contentType) {
        const [workflows] = await executeQuery(
            `SELECT w.*, u.name as reviewer_name, u.email as reviewer_email
             FROM content_workflow w
             LEFT JOIN users u ON w.current_reviewer_id = u.id
             WHERE w.content_id = ? AND w.content_type = ?`,
            [contentId, contentType]
        );

        if (workflows.length === 0) {
            return null;
        }

        const workflow = workflows[0];

        // Get workflow history
        const [history] = await executeQuery(
            `SELECT wh.*, u.name as changed_by_name
             FROM workflow_history wh
             LEFT JOIN users u ON wh.changed_by = u.id
             WHERE wh.workflow_id = ?
             ORDER BY wh.created_at DESC`,
            [workflow.id]
        );

        workflow.history = history;
        return workflow;
    }

    // Update workflow status
    async updateWorkflowStatus(workflowId, newStatus, changedBy, notes = '') {
        const [currentWorkflow] = await executeQuery(
            'SELECT * FROM content_workflow WHERE id = ?',
            [workflowId]
        );

        if (currentWorkflow.length === 0) {
            throw new Error('Workflow not found');
        }

        const workflow = currentWorkflow[0];
        const oldStatus = workflow.status;

        // Validate status transition
        if (!this.isValidStatusTransition(oldStatus, newStatus)) {
            throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
        }

        // Update workflow status
        const updateData = {
            status: newStatus,
            updated_at: new Date()
        };

        // Set specific fields based on new status
        if (newStatus === this.workflowStates.REVIEW) {
            updateData.current_reviewer_id = null; // Will be set when assigned
        } else if (newStatus === this.workflowStates.PUBLISHED) {
            updateData.published_at = new Date();
            updateData.current_reviewer_id = null;
        } else if (newStatus === this.workflowStates.ARCHIVED) {
            updateData.archived_at = new Date();
            updateData.current_reviewer_id = null;
        }

        await executeQuery(
            `UPDATE content_workflow
             SET status = ?, updated_at = ?,
                 current_reviewer_id = ?, published_at = ?, archived_at = ?
             WHERE id = ?`,
            [
                updateData.status,
                updateData.updated_at,
                updateData.current_reviewer_id,
                updateData.published_at,
                updateData.archived_at,
                workflowId
            ]
        );

        // Create workflow history entry
        await executeQuery(
            `INSERT INTO workflow_history (id, workflow_id, from_status, to_status, changed_by, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), workflowId, oldStatus, newStatus, changedBy, notes]
        );

        return {
            workflowId,
            oldStatus,
            newStatus,
            changedBy,
            notes
        };
    }

    // Assign reviewer to content
    async assignReviewer(workflowId, reviewerId, assignedBy, deadline = null) {
        const [workflow] = await executeQuery(
            'SELECT * FROM content_workflow WHERE id = ?',
            [workflowId]
        );

        if (workflow.length === 0) {
            throw new Error('Workflow not found');
        }

        if (workflow[0].status !== this.workflowStates.REVIEW) {
            throw new Error('Content must be in review status to assign reviewer');
        }

        await executeQuery(
            `UPDATE content_workflow
             SET current_reviewer_id = ?, review_deadline = ?, updated_at = NOW()
             WHERE id = ?`,
            [reviewerId, deadline, workflowId]
        );

        // Create workflow history entry
        await executeQuery(
            `INSERT INTO workflow_history (id, workflow_id, to_status, changed_by, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [uuidv4(), workflowId, this.workflowStates.REVIEW, assignedBy, `Reviewer assigned`]
        );

        return {
            workflowId,
            reviewerId,
            deadline,
            assignedBy
        };
    }

    // Add review notes
    async addReviewNotes(workflowId, reviewerId, notes) {
        await executeQuery(
            `UPDATE content_workflow
             SET review_notes = ?, updated_at = NOW()
             WHERE id = ? AND current_reviewer_id = ?`,
            [notes, workflowId, reviewerId]
        );

        return { workflowId, reviewerId, notes };
    }

    // Get content by workflow status
    async getContentByStatus(status, contentType = null, limit = 50, offset = 0) {
        let query = `
            SELECT w.*,
                   CASE
                       WHEN w.content_type = 'course' THEN c.title
                       WHEN w.content_type = 'lesson' THEN l.title
                       ELSE NULL
                   END as content_title,
                   u.name as reviewer_name
            FROM content_workflow w
            LEFT JOIN courses c ON w.content_id = c.id AND w.content_type = 'course'
            LEFT JOIN lessons l ON w.content_id = l.id AND w.content_type = 'lesson'
            LEFT JOIN users u ON w.current_reviewer_id = u.id
            WHERE w.status = ?
        `;

        const params = [status];

        if (contentType) {
            query += ' AND w.content_type = ?';
            params.push(contentType);
        }

        query += ' ORDER BY w.updated_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [content] = await executeQuery(query, params);
        return content;
    }

    // Get pending reviews for a reviewer
    async getPendingReviews(reviewerId, limit = 50, offset = 0) {
        const [reviews] = await executeQuery(
            `SELECT w.*,
                    CASE
                        WHEN w.content_type = 'course' THEN c.title
                        WHEN w.content_type = 'lesson' THEN l.title
                        ELSE NULL
                    END as content_title,
                    u.name as content_creator_name
             FROM content_workflow w
             LEFT JOIN courses c ON w.content_id = c.id AND w.content_type = 'course'
             LEFT JOIN lessons l ON w.content_id = l.id AND w.content_type = 'lesson'
             LEFT JOIN users u ON c.instructor_id = u.id OR l.instructor_id = u.id
             WHERE w.current_reviewer_id = ? AND w.status = ?
             ORDER BY w.review_deadline ASC, w.updated_at DESC
             LIMIT ? OFFSET ?`,
            [reviewerId, this.workflowStates.REVIEW, limit, offset]
        );

        return reviews;
    }

    // Add metadata to content
    async addMetadata(contentId, contentType, metadata) {
        const metadataId = uuidv4();

        await executeQuery(
            `INSERT INTO content_metadata (id, content_id, content_type, metadata_key, metadata_value, metadata_type, is_public, is_searchable)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                metadataId,
                contentId,
                contentType,
                metadata.key,
                metadata.value,
                metadata.type || 'string',
                metadata.isPublic !== false,
                metadata.isSearchable !== false
            ]
        );

        return metadataId;
    }

    // Update metadata
    async updateMetadata(metadataId, metadata) {
        await executeQuery(
            `UPDATE content_metadata
             SET metadata_value = ?, metadata_type = ?, is_public = ?, is_searchable = ?, updated_at = NOW()
             WHERE id = ?`,
            [
                metadata.value,
                metadata.type || 'string',
                metadata.isPublic !== false,
                metadata.isSearchable !== false,
                metadataId
            ]
        );

        return metadataId;
    }

    // Get content metadata
    async getContentMetadata(contentId, contentType, includePrivate = false) {
        let query = `
            SELECT * FROM content_metadata
            WHERE content_id = ? AND content_type = ?
        `;

        const params = [contentId, contentType];

        if (!includePrivate) {
            query += ' AND is_public = TRUE';
        }

        query += ' ORDER BY metadata_key';

        const [metadata] = await executeQuery(query, params);
        return metadata;
    }

    // Add tags to content
    async addTags(contentId, contentType, tags) {
        const tagIds = [];

        for (const tag of tags) {
            const tagId = uuidv4();

            await executeQuery(
                `INSERT INTO content_tags (id, content_id, content_type, tag_name, tag_category, tag_weight)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    tagId,
                    contentId,
                    contentType,
                    tag.name,
                    tag.category || 'general',
                    tag.weight || 1.00
                ]
            );

            tagIds.push(tagId);
        }

        return tagIds;
    }

    // Get content tags
    async getContentTags(contentId, contentType) {
        const [tags] = await executeQuery(
            `SELECT * FROM content_tags
             WHERE content_id = ? AND content_type = ?
             ORDER BY tag_weight DESC, tag_name`,
            [contentId, contentType]
        );

        return tags;
    }

    // Search content by metadata and tags
    async searchContentByMetadata(searchParams) {
        let query = `
            SELECT DISTINCT w.*,
                   CASE
                       WHEN w.content_type = 'course' THEN c.title
                       WHEN w.content_type = 'lesson' THEN l.title
                       ELSE NULL
                   END as content_title,
                   u.name as reviewer_name
            FROM content_workflow w
            LEFT JOIN courses c ON w.content_id = c.id AND w.content_type = 'course'
            LEFT JOIN lessons l ON w.content_id = l.id AND w.content_type = 'lesson'
            LEFT JOIN users u ON w.current_reviewer_id = u.id
            LEFT JOIN content_metadata cm ON w.content_id = cm.content_id AND w.content_type = cm.content_type
            LEFT JOIN content_tags ct ON w.content_id = ct.content_id AND w.content_type = ct.content_type
            WHERE 1=1
        `;

        const params = [];

        // Add status filter
        if (searchParams.status) {
            query += ' AND w.status = ?';
            params.push(searchParams.status);
        }

        // Add content type filter
        if (searchParams.contentType) {
            query += ' AND w.content_type = ?';
            params.push(searchParams.contentType);
        }

        // Add metadata search
        if (searchParams.metadata) {
            for (const [key, value] of Object.entries(searchParams.metadata)) {
                query += ' AND cm.metadata_key = ? AND cm.metadata_value LIKE ?';
                params.push(key, `%${value}%`);
            }
        }

        // Add tag search
        if (searchParams.tags && searchParams.tags.length > 0) {
            const tagPlaceholders = searchParams.tags.map(() => '?').join(',');
            query += ` AND ct.tag_name IN (${tagPlaceholders})`;
            params.push(...searchParams.tags);
        }

        query += ' ORDER BY w.updated_at DESC';

        if (searchParams.limit) {
            query += ' LIMIT ?';
            params.push(searchParams.limit);
        }

        const [results] = await executeQuery(query, params);
        return results;
    }

    // Get workflow statistics
    async getWorkflowStatistics() {
        const [stats] = await executeQuery(
            `SELECT
                status,
                content_type,
                COUNT(*) as count
             FROM content_workflow
             GROUP BY status, content_type
             ORDER BY content_type, status`
        );

        return stats;
    }

    // Get overdue reviews
    async getOverdueReviews() {
        const [overdue] = await executeQuery(
            `SELECT w.*,
                    CASE
                        WHEN w.content_type = 'course' THEN c.title
                        WHEN w.content_type = 'lesson' THEN l.title
                        ELSE NULL
                    END as content_title,
                    u.name as reviewer_name,
                    DATEDIFF(NOW(), w.review_deadline) as days_overdue
             FROM content_workflow w
             LEFT JOIN courses c ON w.content_id = c.id AND w.content_type = 'course'
             LEFT JOIN lessons l ON w.content_id = l.id AND w.content_type = 'lesson'
             LEFT JOIN users u ON w.current_reviewer_id = u.id
             WHERE w.status = ? AND w.review_deadline < NOW()
             ORDER BY w.review_deadline ASC`,
            [this.workflowStates.REVIEW]
        );

        return overdue;
    }

    // Validate status transition
    isValidStatusTransition(fromStatus, toStatus) {
        const validTransitions = {
            [this.workflowStates.DRAFT]: [this.workflowStates.REVIEW, this.workflowStates.ARCHIVED],
            [this.workflowStates.REVIEW]: [this.workflowStates.DRAFT, this.workflowStates.APPROVED, this.workflowStates.ARCHIVED],
            [this.workflowStates.APPROVED]: [this.workflowStates.PUBLISHED, this.workflowStates.REVIEW, this.workflowStates.ARCHIVED],
            [this.workflowStates.PUBLISHED]: [this.workflowStates.ARCHIVED],
            [this.workflowStates.ARCHIVED]: [this.workflowStates.DRAFT]
        };

        return validTransitions[fromStatus]?.includes(toStatus) || false;
    }

    // Bulk update content status
    async bulkUpdateStatus(contentIds, contentType, newStatus, changedBy, notes = '') {
        const results = [];

        for (const contentId of contentIds) {
            try {
                const workflow = await this.getWorkflow(contentId, contentType);
                if (workflow) {
                    const result = await this.updateWorkflowStatus(workflow.id, newStatus, changedBy, notes);
                    results.push({ contentId, success: true, result });
                } else {
                    results.push({ contentId, success: false, error: 'Workflow not found' });
                }
            } catch (error) {
                results.push({ contentId, success: false, error: error.message });
            }
        }

        return results;
    }

    // Get content workflow timeline
    async getWorkflowTimeline(workflowId) {
        const [timeline] = await executeQuery(
            `SELECT wh.*, u.name as changed_by_name, u.email as changed_by_email
             FROM workflow_history wh
             LEFT JOIN users u ON wh.changed_by = u.id
             WHERE wh.workflow_id = ?
             ORDER BY wh.created_at ASC`,
            [workflowId]
        );

        return timeline;
    }
}

module.exports = new ContentWorkflowService();