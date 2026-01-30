import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, FileText, Mail, CheckCircle, XCircle, Download, Trash2 } from 'lucide-react';
import { listJobs, listSubmissions, createJob, downloadPDF, deleteJob, deleteSubmission } from '../api';
import type { Job, Submission } from '../types';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'submissions'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);

  const [newJob, setNewJob] = useState({
    form_type: 'service_order',
    customer_name: '',
    customer_address: '',
    account_number: '',
    person_to_see: '',
    terms: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'jobs') {
        const jobsData = await listJobs();
        setJobs(jobsData);
      } else {
        const submissionsData = await listSubmissions();
        setSubmissions(submissionsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJob(newJob);
      setShowCreateJob(false);

      setNewJob({
        form_type: 'service_order',
        customer_name: '',
        customer_address: '',
        account_number: '',
        person_to_see: '',
        terms: '',
      });

      loadData();
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const copyShareLink = (shareToken: string) => {
    const link = `${window.location.origin}/form/${shareToken}`;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const handleDeleteJob = async (jobId: number) => {
    try {
      await deleteJob(jobId);
      loadData(); // Reload the list
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job');
    }
  };

  const handleDeleteSubmission = async (submissionId: number) => {
    try {
      await deleteSubmission(submissionId);
      loadData(); // Reload the list
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">iField Sync</h1>
              <p className="text-gray-600">Admin Dashboard</p>
            </div>
            {activeTab === 'jobs' && (
              <button
                onClick={() => setShowCreateJob(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Job
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Jobs & Share Links
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Submissions
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === 'jobs' ? (
          <JobsList jobs={jobs} onCopyLink={copyShareLink} onDelete={handleDeleteJob} />
        ) : (
          <SubmissionsList submissions={submissions} onDelete={handleDeleteSubmission} />
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Job</h2>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Type *
                </label>
                <select
                  value={newJob.form_type}
                  onChange={(e) =>
                    setNewJob((prev) => ({ ...prev, form_type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="service_order">Service Order</option>
                  <option value="certificate">Aboveground Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newJob.customer_name}
                  onChange={(e) =>
                    setNewJob((prev) => ({ ...prev, customer_name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={newJob.customer_address}
                  onChange={(e) =>
                    setNewJob((prev) => ({ ...prev, customer_address: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={newJob.account_number}
                    onChange={(e) =>
                      setNewJob((prev) => ({ ...prev, account_number: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Person to See
                  </label>
                  <input
                    type="text"
                    value={newJob.person_to_see}
                    onChange={(e) =>
                      setNewJob((prev) => ({ ...prev, person_to_see: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms
                </label>
                <input
                  type="text"
                  value={newJob.terms}
                  onChange={(e) =>
                    setNewJob((prev) => ({ ...prev, terms: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateJob(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function JobsList({
  jobs,
  onCopyLink,
  onDelete,
}: {
  jobs: Job[];
  onCopyLink: (token: string) => void;
  onDelete: (jobId: number) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
        <p className="text-gray-600">Create your first job to generate a share link</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {jobs.map((job) => (
        <div key={job.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{job.customer_name}</h3>
              {job.customer_address && (
                <p className="text-sm text-gray-600 mt-1">{job.customer_address}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                {job.account_number && (
                  <span>Account: {job.account_number}</span>
                )}
                <span>Created: {format(new Date(job.created_at), 'MMM d, yyyy')}</span>
                <span className={job.is_active ? 'text-green-600' : 'text-red-600'}>
                  {job.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onCopyLink(job.share_token)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Copy Link
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete job for ${job.customer_name}?`)) {
                    onDelete(job.id);
                  }
                }}
                className="flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Share Link:</p>
            <p className="text-sm font-mono text-gray-800 break-all">
              {window.location.origin}/form/{job.share_token}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SubmissionsList({ submissions, onDelete }: { submissions: Submission[]; onDelete: (submissionId: number) => void }) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
        <p className="text-gray-600">Submissions will appear here when forms are completed</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date of Call
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Submitted
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map((submission) => (
            <tr key={submission.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {submission.customer_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {submission.date_of_call}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {submission.uploaded_to_projectsight && (
                    <span className="flex items-center text-xs text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      ProjectSight
                    </span>
                  )}
                  {submission.emailed && (
                    <span className="flex items-center text-xs text-blue-600">
                      <Mail className="w-4 h-4 mr-1" />
                      Emailed
                    </span>
                  )}
                  {!submission.uploaded_to_projectsight && !submission.emailed && (
                    <span className="flex items-center text-xs text-gray-500">
                      <XCircle className="w-4 h-4 mr-1" />
                      Manual
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex space-x-2 items-center">
                  <Link
                    to={`/submissions/${submission.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </Link>
                  {submission.pdf_filename && (
                    <a
                      href={downloadPDF(submission.id)}
                      download
                      className="text-green-600 hover:text-green-800 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Delete submission for ${submission.customer_name}?`)) {
                        onDelete(submission.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
