import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { getSubmission, downloadPDF, downloadPhoto } from '../api';
import type { SubmissionDetail as SubmissionDetailType } from '../types';
import { format } from 'date-fns';

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<SubmissionDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getSubmission(parseInt(id));
      setSubmission(data);
    } catch (error) {
      console.error('Error loading submission:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission not found</h2>
          <Link to="/admin" className="text-blue-600 hover:text-blue-800">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin"
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Service Order #{submission.id}
                </h1>
                <p className="text-gray-600 mt-1">
                  Submitted {format(new Date(submission.submitted_at), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>

              {submission.pdf_filename && (
                <a
                  href={downloadPDF(submission.id)}
                  download
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              )}
            </div>

            {/* Upload Status */}
            {(submission.uploaded_to_projectsight || submission.emailed) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Delivery Status</h3>
                <div className="flex flex-wrap gap-2">
                  {submission.uploaded_to_projectsight && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      Uploaded to ProjectSight
                    </span>
                  )}
                  {submission.emailed && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Emailed
                    </span>
                  )}
                </div>
                {submission.upload_notes && (
                  <p className="mt-2 text-sm text-gray-600">{submission.upload_notes}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-600">Customer Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{submission.customer_name}</dd>
            </div>
            {submission.customer_address && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{submission.customer_address}</dd>
              </div>
            )}
            {submission.account_number && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Account Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{submission.account_number}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-600">Date of Call</dt>
              <dd className="mt-1 text-sm text-gray-900">{submission.date_of_call}</dd>
            </div>
            {submission.person_to_see && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Person to See</dt>
                <dd className="mt-1 text-sm text-gray-900">{submission.person_to_see}</dd>
              </div>
            )}
            {submission.terms && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Terms</dt>
                <dd className="mt-1 text-sm text-gray-900">{submission.terms}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Work Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Work Details</h2>
          {submission.special_instructions && (
            <div className="mb-4">
              <dt className="text-sm font-medium text-gray-600 mb-1">Special Instructions</dt>
              <dd className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                {submission.special_instructions}
              </dd>
            </div>
          )}
          {(submission.time_in || submission.time_out) && (
            <div className="grid grid-cols-2 gap-4">
              {submission.time_in && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Time In</dt>
                  <dd className="mt-1 text-sm text-gray-900">{submission.time_in}</dd>
                </div>
              )}
              {submission.time_out && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Time Out</dt>
                  <dd className="mt-1 text-sm text-gray-900">{submission.time_out}</dd>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Materials */}
        {submission.materials.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Materials / Services</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Weight
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submission.materials.map((material, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{material.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{material.weight}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{material.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{material.unit_price}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{material.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Subtotal:</span>
                    <span>${submission.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Tax:</span>
                    <span>${submission.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>${submission.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photos */}
        {submission.photos.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {submission.photos.map((photo, index) => (
                <a
                  key={index}
                  href={downloadPhoto(submission.id, photo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block"
                >
                  <img
                    src={downloadPhoto(submission.id, photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg shadow"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
