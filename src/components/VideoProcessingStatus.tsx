import React, { useState, useEffect } from 'react';
import Button from './ui/Button';

interface ProcessingJob {
  id: string;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface VideoProcessingStatusProps {
  videoAssetId: string;
}

export const VideoProcessingStatus: React.FC<VideoProcessingStatusProps> = ({ videoAssetId }) => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [videoAssetId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/video-content/status/${videoAssetId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else {
        setError('Failed to fetch processing status');
      }
    } catch (error) {
      setError('Failed to fetch processing status');
    } finally {
      setLoading(false);
    }
  };

  const retryJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/video-content/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchStatus(); // Refresh status
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

  const getJobTypeLabel = (jobType: string) => {
    return jobType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Video Processing Status</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                {getJobTypeLabel(job.job_type)}
              </h3>
              <span className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
            </div>

            {job.status === 'processing' && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {job.status === 'failed' && job.error_message && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">
                  <strong>Error:</strong> {job.error_message}
                </p>
                <Button
                  onClick={() => retryJob(job.id)}
                  className="mt-2 text-xs bg-red-600 hover:bg-red-700"
                >
                  Retry Job
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p>Created: {new Date(job.created_at).toLocaleString()}</p>
              <p>Updated: {new Date(job.updated_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          No processing jobs found
        </div>
      )}
    </div>
  );
};