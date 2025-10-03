import { NextResponse } from 'next/server';
// Prediction functionality temporarily disabled
// import { exec, spawn } from 'child_process';
// import { promisify } from 'util';
import path from 'path';

// const execAsync = promisify(exec);

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    if (!action || !['start', 'stop', 'status'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: start, stop, or status' },
        { status: 400 }
      );
    }

    // Prediction functionality temporarily disabled
    console.log(`🚫 Prediction disabled: ${action} request received`);
    
    // Return mock responses for now
    if (action === 'status') {
      return NextResponse.json({
        success: true,
        action: 'status',
        result: {
          running: false,
          message: 'Prediction functionality temporarily disabled',
          disabled: true
        },
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'start' || action === 'stop') {
      return NextResponse.json({
        success: false,
        action,
        result: {
          message: 'Prediction functionality temporarily disabled',
          disabled: true
        },
        timestamp: new Date().toISOString()
      });
    }

    /* Prediction functionality temporarily disabled
    const scriptPath = path.join(process.cwd(), 'scripts', 'prediction.py');
    
    // Handle 'start' action differently to avoid timeout issues
    if (action === 'start') {
      // Use spawn for non-blocking start
      const pythonProcess = spawn('python', [scriptPath, 'start'], {
        cwd: process.cwd(),
        detached: true,
        stdio: 'ignore',
        env: { ...process.env }
      });
      
      pythonProcess.unref(); // Allow parent to exit independently
      
      // Wait a moment to see if it starts successfully
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check status to confirm it started
      const statusCommand = `cd ${process.cwd()} && source venv/bin/activate && python ${scriptPath} status`;
      const { stdout: statusOutput } = await execAsync(statusCommand, { timeout: 10000 });
      
      let statusResult;
      try {
        statusResult = JSON.parse(statusOutput);
      } catch (e) {
        statusResult = { message: statusOutput.trim() };
      }
      
      return NextResponse.json({
        success: true,
        action: 'start',
        result: statusResult.running ? 
          { message: 'Prediction started successfully', ...statusResult } : 
          { message: 'Failed to start prediction', ...statusResult },
        timestamp: new Date().toISOString()
      });
    }
    
    // For stop and status, use regular execution
    const command = `cd ${process.cwd()} && source venv/bin/activate && python ${scriptPath} ${action}`;
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 15000,
      maxBuffer: 1024 * 1024 
    });

    if (stderr && !stderr.includes('warning')) {
      console.error('Prediction stderr:', stderr);
      return NextResponse.json(
        { error: 'Prediction command failed', details: stderr },
        { status: 500 }
      );
    }

    let result;
    try {
      result = JSON.parse(stdout);
    } catch (parseError) {
      result = { message: stdout.trim() };
    }

    console.log(`✅ Prediction ${action} result:`, result);

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });
    */

  } catch (error) {
    console.error('Prediction API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        action: action || 'unknown'
      },
      { status: 500 }
    );
  }
}