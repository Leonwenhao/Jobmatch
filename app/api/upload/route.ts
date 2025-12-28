import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { sessionStorage } from '@/lib/storage';
import { UploadResponse, Session } from '@/lib/types';
import { parseResume, validateResumeText } from '@/lib/claude';

// Use require for pdf-parse (CommonJS module)
const pdfParse = require('pdf-parse') as (
  dataBuffer: Buffer,
  options?: any
) => Promise<{ text: string; numpages: number }>;

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

/**
 * POST /api/upload
 * Handles resume upload, validation, and text extraction
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 413 }
      );
    }

    // Convert file to buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    let resumeText: string;
    try {
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return NextResponse.json(
        { error: 'Failed to parse PDF. Please ensure the file is a valid PDF document.' },
        { status: 400 }
      );
    }

    // Validate resume text content
    const validation = validateResumeText(resumeText);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Parse resume with Claude API to extract structured data
    let parsedResume;
    try {
      parsedResume = await parseResume(resumeText.trim());
    } catch (parseError) {
      console.error('Resume parsing error:', parseError);
      return NextResponse.json(
        { error: 'We had trouble reading your resume. Please try a different file or contact support.' },
        { status: 400 }
      );
    }

    // Generate unique session ID
    const sessionId = randomUUID();

    // Create session object
    const session: Session = {
      id: sessionId,
      email: '', // Will be set during checkout
      resumeText: resumeText.trim(),
      parsedResume, // Store parsed resume data
      status: 'pending',
      createdAt: new Date(),
    };

    // Store session in memory
    sessionStorage.set(sessionId, session);

    // Return success response
    const response: UploadResponse = {
      sessionId,
      message: 'Resume uploaded successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your upload.' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - not supported
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
