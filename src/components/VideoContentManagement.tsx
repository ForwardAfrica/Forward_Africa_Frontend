import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import ErrorMessage from './ui/ErrorMessage';
import { SuccessMessage } from './ui/SuccessMessage';
import { WorkflowStatus, Workflow } from '../types';

interface VideoAsset {
  id: string;
  lesson_id: string;
  original_filename: string;
  original_path: string;
  original_size: number;
  original_duration: number;
  original_format: string;
  original_resolution: string;
  original_bitrate: number;
  upload_status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed';
  processing_status: 'pending' | 'transcoding' | 'subtitle_generation' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface TranscodingJob {
  id: string;
  video_asset_id: string;
  resolution: string;
  quality: 'high' | 'medium' | 'low';
  format: string;
  file_path: string;
  file_size: number;
  bitrate: number;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  processing_started_at: string;
  processing_completed_at: string;
  error_message: string;
}

interface Subtitle {
  id: string;
  video_asset_id: string;
  language: string;
  format: 'srt' | 'vtt' | 'json';
  file_path: string;
  confidence_score: number;
  word_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_started_at: string;
  processing_completed_at: string;
  error_message: string;
}

interface ProcessingJob {
  id: string;
  job_type: 'video_transcoding' | 'subtitle_generation' | 'metadata_extraction' | 'thumbnail_generation';
  content_id: string;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  parameters: any;
  result_data: any;
  error_message: string;
  started_at: string;
  completed_at: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

interface VideoContentManagementProps {
  lessonId?: string;
  onVideoUploaded?: (videoAssetId: string) => void;
}

export const VideoContentManagement: React.FC<VideoContentManagementProps> = ({
  lessonId,
  onVideoUploaded
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoAssetId, setVideoAssetId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [metadata, setMetadata] = useState<any>({});
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'status' | 'workflow' | 'metadata'>('upload');

  // Polling for status updates
  useEffect(() => {
    if (videoAssetId) {
      const interval = setInterval(() => {
        fetchProcessingStatus();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [videoAssetId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        setError('File size exceeds 500MB limit');
        return;
      }
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !lessonId) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('title', selectedFile.name);
    formData.append('description', 'Video upload');
    formData.append('tags', JSON.stringify(['video', 'upload']));
    formData.append('metadata', JSON.stringify({
      originalName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type
    }));

    try {
      const response = await fetch(`/api/video-content/upload/${lessonId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setVideoAssetId(result.videoAssetId);
      setWorkflow({ id: result.workflowId, content_id: lessonId, content_type: 'lesson', status: 'draft' } as Workflow);
      setSuccess('Video upload started successfully. Processing jobs have been queued.');
      setActiveTab('status');

      if (onVideoUploaded) {
        onVideoUploaded(result.videoAssetId);
      }
    } catch (error) {
      setError('Failed to upload video. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fetchProcessingStatus = async () => {
    if (!videoAssetId) return;

    try {
      const response = await fetch(`/api/video-content/status/${videoAssetId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProcessingStatus(data);
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching processing status:', error);
    }
  };

  const updateWorkflowStatus = async (newStatus: WorkflowStatus, notes?: string) => {
    if (!workflow) return;

    try {
      const response = await fetch(`/api/video-content/workflow/${workflow.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus, notes })
      });

      if (response.ok) {
        const result = await response.json();
        setWorkflow(prev => prev ? { ...prev, status: newStatus } : null);
        setSuccess(`Workflow status updated to ${newStatus}`);
      }
    } catch (error) {
      setError('Failed to update workflow status');
    }
  };

  const addMetadata = async () => {
    if (!lessonId) return;

    try {
      const response = await fetch(`/api/video-content/metadata/lesson/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ metadata })
      });

      if (response.ok) {
        setSuccess('Metadata added successfully');
        setMetadata({});
      }
    } catch (error) {
      setError('Failed to add metadata');
    }
  };

  const addTags = async () => {
    if (!lessonId) return;

    try {
      const response = await fetch(`/api/video-content/tags/lesson/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tags: tags.map(tag => ({ name: tag, category: 'general' })) })
      });

      if (response.ok) {
        setSuccess('Tags added successfully');
        setTags([]);
      }
    } catch (error) {
      setError('Failed to add tags');
    }
  };

  const retryFailedJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/video-content/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSuccess('Job retry initiated');
        fetchProcessingStatus();
      }
    } catch (error) {
      setError('Failed to retry job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getWorkflowStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case 'published': return 'text-green-600';
      case 'approved': return 'text-blue-600';
      case 'review': return 'text-yellow-600';
      case 'draft': return 'text-gray-600';
      case 'archived': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Video Content Management</h2>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess(null)} />}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 font-medium ${activeTab === 'upload' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Upload Video
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 font-medium ${activeTab === 'status' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Processing Status
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-4 py-2 font-medium ${activeTab === 'workflow' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Workflow
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`px-4 py-2 font-medium ${activeTab === 'metadata' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Metadata & Tags
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="space-y-4">
              <div className="text-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Select Video File
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                MP4, MOV, AVI up to 500MB
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Selected File:</h3>
              <p className="text-sm text-gray-600">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          {processingStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video Asset Status */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Video Asset</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Status:</span>
                    <span className={`ml-2 ${getStatusColor(processingStatus.videoAsset?.processing_status)}`}>
                      {processingStatus.videoAsset?.processing_status}
                    </span>
                  </p>
                  <p><span className="font-medium">Duration:</span> {processingStatus.videoAsset?.original_duration}s</p>
                  <p><span className="font-medium">Resolution:</span> {processingStatus.videoAsset?.original_resolution}</p>
                  <p><span className="font-medium">Size:</span> {(processingStatus.videoAsset?.original_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>

              {/* Processing Jobs */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Processing Jobs</h3>
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{job.job_type.replace('_', ' ')}</span>
                        <span className={`text-sm ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      {job.status === 'processing' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{job.progress}%</span>
                        </div>
                      )}
                      {job.status === 'failed' && (
                        <div className="mt-2">
                          <p className="text-xs text-red-600">{job.error_message}</p>
                          <Button
                            onClick={() => retryFailedJob(job.id)}
                            className="mt-1 text-xs bg-red-600 hover:bg-red-700"
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!processingStatus && (
            <div className="text-center text-gray-500">
              No video processing status available
            </div>
          )}
        </div>
      )}

      {/* Workflow Tab */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          {workflow && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Content Workflow</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p><span className="font-medium">Status:</span>
                    <span className={`ml-2 ${getWorkflowStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </span>
                  </p>
                  <p><span className="font-medium">Content Type:</span> {workflow.content_type}</p>
                  <p><span className="font-medium">Created:</span> {new Date(workflow.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p><span className="font-medium">Last Updated:</span> {new Date(workflow.updated_at).toLocaleDateString()}</p>
                  {workflow.review_notes && (
                    <p><span className="font-medium">Review Notes:</span> {workflow.review_notes}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Update Status:</h4>
                <div className="flex flex-wrap gap-2">
                  {['draft', 'review', 'approved', 'published', 'archived'].map((status) => (
                    <Button
                      key={status}
                      onClick={() => updateWorkflowStatus(status as WorkflowStatus)}
                      disabled={workflow.status === status}
                      className={`text-sm ${workflow.status === status ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!workflow && (
            <div className="text-center text-gray-500">
              No workflow information available
            </div>
          )}
        </div>
      )}

      {/* Metadata Tab */}
      {activeTab === 'metadata' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Metadata */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Add Metadata</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                  <input
                    type="text"
                    value={metadata.key || ''}
                    onChange={(e) => setMetadata({ ...metadata, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., difficulty_level"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="text"
                    value={metadata.value || ''}
                    onChange={(e) => setMetadata({ ...metadata, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., beginner"
                  />
                </div>
                <Button
                  onClick={addMetadata}
                  disabled={!metadata.key || !metadata.value}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Add Metadata
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Add Tags</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                  <input
                    type="text"
                    value={tags.join(', ')}
                    onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., business, fundamentals, strategy"
                  />
                </div>
                <Button
                  onClick={addTags}
                  disabled={tags.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Add Tags
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};