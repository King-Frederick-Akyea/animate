import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would return an actual video file
    // For now, return a mock success response
    return NextResponse.json({
      success: true,
      downloadUrl: `/api/export/mock-video/${projectId}.mp4`,
      status: 'completed',
      message: 'Video export started successfully'
    });
  } catch (error: any) {
    console.error('Export download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}