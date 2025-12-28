import UploadForm from "@/components/UploadForm";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Stop Scrolling. Start Applying.
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-2">
            Upload your resume, get 25 jobs you're actually qualified for.
          </p>
          <p className="text-lg text-gray-600">
            No account needed. Just $5. Results in minutes.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto">
          <UploadForm />
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                1. Upload Resume
              </h3>
              <p className="text-gray-600">
                Drop your PDF resume. No forms, no account signup required.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-4">💳</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                2. Pay $5
              </h3>
              <p className="text-gray-600">
                Quick, secure checkout. AI processes your resume instantly.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                3. Get 25 Jobs
              </h3>
              <p className="text-gray-600">
                See 5 matches instantly. Receive 20 more via email.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Secure payment via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Resume deleted after processing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>No spam, no marketing emails</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>&copy; 2025 JobMatch. Helping job seekers find their next opportunity.</p>
        </div>
      </footer>
    </div>
  );
}
