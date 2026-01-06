export default function CancelPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-marty-gray rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-marty-black mb-4 tracking-tight">
          Payment Cancelled
        </h1>
        <p className="text-gray-500 mb-2">
          Your payment was cancelled. No charges were made.
        </p>
        <p className="text-sm text-gray-400 mb-10">
          If you experienced any issues, please try again or contact support.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-block px-8 py-4 bg-marty-black hover:bg-marty-orange text-white font-semibold rounded-full transition-all duration-300"
          >
            Try Again
          </a>
          <a
            href="mailto:support@jobmatch.com"
            className="inline-block px-8 py-4 bg-marty-gray hover:bg-gray-200 text-marty-black font-medium rounded-full transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
