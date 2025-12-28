import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobMatch - Upload Your Resume, Get 25 Matched Jobs",
  description: "Stop scrolling. Start applying. Upload your resume and receive 25 curated job postings matched to your qualifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
