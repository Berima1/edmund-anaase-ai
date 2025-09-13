import { NextRequest, NextResponse } from 'next/server';

// Simple document ingestion endpoint
export async function POST(request: NextRequest) {
  try {
    const { id, title, content, metadata } = await request.json();
    
    if (!id || !title || !content) {
      return NextResponse.json(
        { error: 'ID, title, and content are required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would store this in a database
    // For this demo, we'll just acknowledge the ingestion
    console.log(`Document ingested: ${id} - ${title}`);

    return NextResponse.json({
      message: `Document '${id}' ingested successfully`,
      result: {
        ok: true,
        id,
        title,
        contentLength: content.length,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Ingest API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during ingestion' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'anaase-ingest-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
         }
