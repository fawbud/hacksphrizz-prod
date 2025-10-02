import { supabaseAdmin } from '../../../utils/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, captchaToken, captchaType = 'hcaptcha' } = body;

    if (!userId || !captchaToken) {
      return NextResponse.json({ 
        error: 'userId and captchaToken are required' 
      }, { status: 400 });
    }

    // Verify captcha token dengan service yang sesuai
    let isValid = false;
    
    if (captchaType === 'hcaptcha') {
      isValid = await verifyHCaptcha(captchaToken);
    } else if (captchaType === 'recaptcha') {
      isValid = await verifyReCaptcha(captchaToken);
    }

    if (!isValid) {
      return NextResponse.json({ 
        error: 'Invalid captcha' 
      }, { status: 400 });
    }

    // Update trust level user yang berhasil menyelesaikan captcha
    const { data, error } = await supabaseAdmin
      .from('queue')
      .update({ 
        trust_level: 'Medium',
        trust_score: Math.min(80, (await getCurrentTrustScore(userId)) + 20) // Boost score
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating trust after captcha:', error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Captcha verified successfully',
      newTrustLevel: 'Medium',
      trustScore: data.trust_score
    });

  } catch (error) {
    console.error('Unexpected error in captcha verification:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function verifyHCaptcha(token) {
  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error verifying hCaptcha:', error);
    return false;
  }
}

async function verifyReCaptcha(token) {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true && data.score > 0.5; // For reCaptcha v3
  } catch (error) {
    console.error('Error verifying reCaptcha:', error);
    return false;
  }
}

async function getCurrentTrustScore(userId) {
  try {
    const { data } = await supabaseAdmin
      .from('queue')
      .select('trust_score')
      .eq('user_id', userId)
      .single();
    
    return data?.trust_score || 50; // Default score
  } catch (error) {
    return 50; // Default score
  }
}