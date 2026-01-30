import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Form Submitted Successfully!
        </h1>
        <p className="text-gray-600 mb-8">
          Your service order has been submitted and the PDF has been generated.
          The office has been notified.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            You can close this page now.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
