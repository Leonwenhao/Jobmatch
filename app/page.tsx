import UploadForm from "@/components/UploadForm";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-marty-black leading-[0.9] tracking-tighter mb-6">
            Lock In.<br />
            <span className="text-marty-orange">Land the Job.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-lg mb-12 leading-relaxed">
            Upload your resume. Get 25 jobs matched to you.
          </p>

          {/* Upload Section */}
          <div className="w-full max-w-xl">
            <UploadForm />
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-marty-black mb-12 tracking-tight">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-marty-gray rounded-xl p-8 text-center transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-marty-orange rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-marty-black mb-2">
                Upload Resume
              </h3>
              <p className="text-gray-500 text-sm">
                Drop your PDF. No account needed.
              </p>
            </div>
            <div className="bg-marty-gray rounded-xl p-8 text-center transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-marty-orange rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-marty-black mb-2">
                Pay $2.99
              </h3>
              <p className="text-gray-500 text-sm">
                Secure checkout via Stripe.
              </p>
            </div>
            <div className="bg-marty-gray rounded-xl p-8 text-center transition-all duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-marty-orange rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-marty-black mb-2">
                Get 25 Jobs
              </h3>
              <p className="text-gray-500 text-sm">
                All results + email backup.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-marty-orange font-bold">&#10003;</span>
              <span>Secure payment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-marty-orange font-bold">&#10003;</span>
              <span>Resume deleted after use</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-marty-orange font-bold">&#10003;</span>
              <span>No spam emails</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
