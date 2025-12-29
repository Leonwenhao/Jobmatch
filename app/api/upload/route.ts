import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { setSession } from '@/lib/storage';
import { UploadResponse, Session } from '@/lib/types';
import { parseResumePDF } from '@/lib/claude';

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

/**
 * POST /api/upload
 * Handles resume upload, validation, and parsing with Claude API
 *
 * Claude API can read PDFs directly, so we send the PDF file
 * instead of parsing it locally (which doesn't work in serverless)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

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

    // Convert file to base64 for Claude API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64PDF = buffer.toString('base64');

    // Parse resume with Claude API (sends PDF directly)
    let parsedResume;
    try {
      console.log('Parsing resume with Claude API...');
      parsedResume = await parseResumePDF(base64PDF);
      console.log('Resume parsed successfully:', parsedResume);
    } catch (parseError) {
      console.error('Resume parsing error:', parseError);
      return NextResponse.json(
        {
          error: parseError instanceof Error
            ? parseError.message
            : 'We had trouble reading your resume. Please try a different file or contact support.'
        },
        { status: 400 }
      );
    }

    // Generate unique session ID
    const sessionId = randomUUID();

    // Create session object
    const session: Session = {
      id: sessionId,
      email: '', // Will be set during checkout
      resumeText: '', // Not needed when using PDF directly
      parsedResume, // Store parsed resume data
      status: 'pending',
      createdAt: new Date(),
    };

    // Store session in Redis
    await setSession(sessionId, session);

    console.log(`Session ${sessionId} created successfully`);

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
