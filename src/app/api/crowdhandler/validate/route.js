import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action = 'validate', customParams = {} } = body;

    // Dynamic import to avoid Edge Runtime issues
    const { init } = await import('crowdhandler-sdk');

    // Initialize CrowdHandler
    const { gatekeeper } = init({
      publicKey: process.env.CROWDHANDLER_PUBLIC_KEY,
      privateKey: process.env.CROWDHANDLER_PRIVATE_KEY,
      options: {
        mode: 'hybrid',
        trustOnFail: true,
        debug: process.env.NODE_ENV === 'development',
      }
    });

    // Override request details
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwardedFor || realIP || 'unknown';

    gatekeeper.overrideHost(request.headers.get('host') || 'localhost');
    gatekeeper.overridePath('/api/crowdhandler/validate');
    gatekeeper.overrideIP(clientIP);
    gatekeeper.overrideLang(request.headers.get('accept-language') || 'en-US');
    gatekeeper.overrideUserAgent(request.headers.get('user-agent') || 'Unknown');

    // Handle different actions
    switch (action) {
      case 'validate':
        const result = await gatekeeper.validateRequest(customParams);
        return NextResponse.json({
          success: true,
          data: result,
        });

      case 'performance':
        const { options = {} } = body;
        await gatekeeper.recordPerformance(options);
        return NextResponse.json({
          success: true,
          message: 'Performance recorded successfully',
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('CrowdHandler API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'CrowdHandler validation failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // For GET requests, we'll do a simple status check without full SDK
    // to avoid potential Edge Runtime issues
    
    return NextResponse.json({
      success: true,
      promoted: true, // For development, always return promoted
      status: 'promoted',
      data: {
        promoted: true,
        setCookie: false,
        cookieValue: null,
        domain: null,
        targetURL: null,
        slug: null,
      }
    });

  } catch (error) {
    console.error('CrowdHandler status check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Status check failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
