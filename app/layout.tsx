import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobMatch - Upload Your Resume, Get 25 Matched Jobs",
  description: "Lock in. Land the job. Upload your resume and receive 25 curated job postings matched to your qualifications.",
};

function Header() {
  return (
    <header className="fixed top-0 w-full z-50 px-[5%] py-6 bg-white/90 backdrop-blur-md">
      <div className="text-marty-orange font-extrabold text-2xl tracking-tighter uppercase">
        JobMatch
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="py-8 text-center text-sm text-gray-400">
      &copy; {new Date().getFullYear()} JobMatch. Simplicity is key.
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
