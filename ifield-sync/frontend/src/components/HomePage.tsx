import { Link } from 'react-router-dom';
import { FileText, Users, Smartphone, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            iField Sync
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Mobile-friendly field service forms for fire sprinkler installation teams
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/admin"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard
            icon={<Smartphone className="w-8 h-8" />}
            title="Mobile Optimized"
            description="Complete forms easily on any smartphone or tablet"
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="PDF Generation"
            description="Automatically generates professional PDF service orders"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="No Login Required"
            description="Share secure links directly with field technicians"
          />
          <FeatureCard
            icon={<CheckCircle className="w-8 h-8" />}
            title="Digital Signatures"
            description="Capture GC and technician signatures on device"
          />
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number={1}
              title="Create Job"
              description="Office creates a new job in the admin dashboard and generates a share link"
            />
            <Step
              number={2}
              title="Fill Form"
              description="Field technician opens the link and completes the service order form on their mobile device"
            />
            <Step
              number={3}
              title="Submit & Deliver"
              description="Form generates PDF with signatures and uploads to ProjectSight or sends via email"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600">
          <p>Built for efficient field service documentation</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
