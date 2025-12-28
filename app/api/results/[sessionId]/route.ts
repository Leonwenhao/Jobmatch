import { NextRequest, NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';

/**
 * GET /api/results/[sessionId]
 * Fetch job results for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session data
    const session = sessionStorage.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Return session status and jobs
    return NextResponse.json({
      status: session.status,
      jobs: session.jobs?.slice(0, 5) || [], // Return first 5 jobs for results page
      email: session.email,
      totalJobs: session.jobs?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
