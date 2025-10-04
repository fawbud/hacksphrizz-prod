import { supabaseAdmin } from '@/utils/supabase';
import { calculateTrustScore, validateMetrics } from '@/utils/trustScoreAI';
import QwenAI from '@/utils/qwenAI';
import { NextResponse } from 'next/server';

// VERSION: 4.0.0-QWEN (Updated: 2025-10-04)
console.log('🔧 API route.js VERSION 4.0.0-QWEN loaded');

// Initialize Qwen AI service
const qwenAI = new QwenAI();

export async function POST(request) {
  console.log('🔄 Starting behavior track API request...');
  
  // Check if we have a valid service key and supabase admin client
  const hasValidServiceKey = supabaseAdmin !== null;
  
  if (!hasValidServiceKey) {
    console.warn('⚠️ No valid Supabase service key - running in database-free mode');
  }
  
  try {
    const body = await request.json();
    const { userId, behaviorData } = body;

    if (!userId || !behaviorData) {
      console.warn('⚠️ Missing required fields:', { userId: !!userId, behaviorData: !!behaviorData });
      return NextResponse.json({ 
        error: 'userId and behaviorData are required' 
      }, { status: 400 });
    }

    // Log payload size for debugging
    const payloadSize = JSON.stringify(body).length;
    console.log(`📊 Payload size: ${payloadSize} bytes`);

    // DEBUG: Log incoming behavior data details
    console.log('🔍 Incoming Behavior Data Summary:');
    console.log('  - User ID:', userId);
    console.log('  - Mouse Movements:', behaviorData.trackingData?.mouseMovements?.length || 0);
    console.log('  - Keystrokes:', behaviorData.trackingData?.keystrokes?.length || 0);
    console.log('  - Form Interactions:', Object.keys(behaviorData.trackingData?.formInteractions || {}).length);
    console.log('  - Session Duration:', behaviorData.trackingData?.sessionMetrics?.totalSessionTime || 0, 'ms');
    console.log('  - Interaction Count:', behaviorData.trackingData?.sessionMetrics?.interactionCount || 0);
    console.log('  - Suspicious Patterns:', behaviorData.trackingData?.sessionMetrics?.suspiciousPatterns?.length || 0);

    // Validate behavior data format
    const validation = validateMetrics(behaviorData);
    if (!validation.valid) {
      console.warn('⚠️ Invalid behavior data format:', validation.errors);
      return NextResponse.json({ 
        error: 'Invalid behavior data format',
        details: validation.errors
      }, { status: 400 });
    }

    let trustResult;
    let analysisMethod = 'unknown';
    let dbSaveSuccess = false;

    // PRIORITY: Use Qwen AI as PRIMARY
    // Qwen provides advanced LLM-based analysis with OpenAI-compatible API
    const qwenApiKey = process.env.QWEN_API_KEY;
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const hasQwenKey = qwenApiKey && qwenApiKey !== 'your_qwen_api_key_here';
    const hasOpenRouterKey = openrouterApiKey && openrouterApiKey !== 'your_openrouter_api_key_here';

    try {
      if (hasOpenRouterKey) {
        console.log('🎯 Using PRIMARY Qwen AI analysis via OpenRouter...');
        trustResult = await qwenAI.analyzeBehavior(behaviorData, openrouterApiKey, true);
        analysisMethod = 'qwen_openrouter';
      } else if (hasQwenKey) {
        console.log('🎯 Using PRIMARY Qwen AI analysis via DashScope...');
        trustResult = await qwenAI.analyzeBehavior(behaviorData, qwenApiKey, false);
        analysisMethod = 'qwen_dashscope';
      } else {
        throw new Error('No Qwen/OpenRouter API key found');
      }

      if (!trustResult.success) {
        throw new Error('Qwen analysis failed');
      }
      console.log('✅ Qwen analysis successful');
      console.log('  - Trust Score:', trustResult.trustScore);
      console.log('  - Trust Level:', trustResult.trustLevel);
      console.log('  - Confidence:', trustResult.confidence);
      console.log('  - Reasons:', trustResult.reasons?.slice(0, 3));
    } catch (qwenError) {
      console.warn('⚠️ Qwen failed, using rule-based fallback:', qwenError.message);

      // Fallback to rule-based system (V4.0 - EXTREMELY GENEROUS)
      try {
        console.log('🔄 Falling back to rule-based AI system (V4.0)...');
        trustResult = await calculateTrustScore(behaviorData);
        analysisMethod = 'rule_based_fallback';

        if (!trustResult.success) {
          throw new Error('Rule-based analysis failed');
        }
        console.log('✅ Rule-based fallback successful');
        console.log('  - Trust Score:', trustResult.trustScore);
        console.log('  - Trust Level:', trustResult.trustLevel);
        console.log('  - Reasons:', trustResult.reasons?.slice(0, 3));
      } catch (fallbackError) {
        console.error('❌ Both AI systems failed:', fallbackError);
        return NextResponse.json({
          error: 'AI analysis completely failed',
          details: {
            qwen_error: qwenError.message,
            fallback_error: fallbackError.message
          }
        }, { status: 500 });
      }
    }

    if (!trustResult || !trustResult.success) {
      console.error('Trust score calculation failed:', trustResult?.error);
      return NextResponse.json({ 
        error: 'Failed to calculate trust score',
        details: trustResult?.error || 'Unknown error'
      }, { status: 500 });
    }

    // Keep trust score in 0-1 range (consistent throughout the system)
    const trustScore = trustResult.trustScore; // Already 0-1 from AI

    // Use trust level from AI result if available, otherwise calculate
    const trustLevel = trustResult.trustLevel || getTrustLevel(trustScore);

    // Use needsCaptcha from AI result if available, otherwise calculate with GENEROUS threshold
    const needsCaptcha = trustResult.needsCaptcha !== undefined
      ? trustResult.needsCaptcha
      : trustScore <= 0.45; // Consistent with BALANCED threshold

    // DEBUG: Log the trust score calculation details
    console.log('📊 Trust Score Calculation Details:');
    console.log('  - Trust Score (0-1):', trustScore);
    console.log('  - Trust Level:', trustLevel);
    console.log('  - Needs Captcha:', needsCaptcha);
    console.log('  - Analysis Method:', analysisMethod);
    console.log('  - Metadata:', trustResult.metadata);

    // Try to save to database only if we have a valid service key
    if (hasValidServiceKey) {
      try {
        // Update trust score in user_trust table (0-1 scale)
        const { data: trustData, error: trustError } = await supabaseAdmin
          .from('user_trust')
          .upsert({
            user_id: userId,
            trust_score: trustScore, // Store as 0-1 decimal
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single();

        if (trustError) {
          console.error('⚠️ Error updating user_trust:', trustError);
        } else {
          console.log('✅ Trust score saved to user_trust table:', trustScore);
          dbSaveSuccess = true;
        }

        // Also update queue table for backward compatibility (if exists)
        const { error: queueError } = await supabaseAdmin
          .from('queue')
          .upsert({
            user_id: userId,
            trust_score: trustScore,
            trust_level: trustLevel,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (queueError) {
          console.warn('⚠️ Queue table update failed (might not exist):', queueError.message);
        }

        // Log behavior data for analysis and debugging
        const { error: logError } = await supabaseAdmin
          .from('behavior_logs')
          .insert([{
            user_id: userId,
            behavior_data: behaviorData,
            trust_score: trustScore, // Store as 0-1
            analysis_method: analysisMethod,
            created_at: new Date().toISOString()
          }]);

        if (logError) {
          console.error('⚠️ Error logging behavior data:', logError);
        } else {
          console.log('✅ Behavior data logged successfully');
        }
      } catch (dbError) {
        console.error('⚠️ Database operations failed:', dbError.message);
        dbSaveSuccess = false;
      }
    } else {
      console.log('📝 Skipping database operations - no valid service key');
      dbSaveSuccess = false;
    }

    // Return successful response even if database failed
    return NextResponse.json({
      success: true,
      message: dbSaveSuccess ? 'Trust score updated successfully' : 'Trust score calculated (database unavailable)',
      trustScore: trustScore, // Return 0-1 scale
      trustLevel: trustLevel,
      confidence: trustResult.confidence,
      needsCaptcha: needsCaptcha,
      reasons: trustResult.reasons,
      analysis: trustResult.analysis,
      aiMethod: analysisMethod, // Which AI system was used
      aiSource: trustResult.source || analysisMethod,
      databaseSaved: dbSaveSuccess,
      metadata: {
        sessionDuration: behaviorData.processed?.totalSessionTime || 0,
        totalInteractions: behaviorData.trackingData?.sessionMetrics?.interactionCount || 0,
        suspiciousPatterns: behaviorData.trackingData?.sessionMetrics?.suspiciousPatterns?.length || 0,
        dataQuality: trustResult.metadata?.dataQuality || 0,
        usedFallback: analysisMethod === 'rule_based_fallback'
      }
    });

  } catch (error) {
    console.error('Unexpected error in behavior tracking:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get current trust score from database
    const { data, error } = await supabaseAdmin
      .from('queue')
      .select('trust_score, trust_level, updated_at')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trust score' },
        { status: 500 }
      );
    }

    // Get trust score from user_trust table (already 0-1 scale)
    const trustScore = data ? data.trust_score : 0.1; // Default to 0.1 for new users
    const trustLevel = data?.trust_level || 'very_low';
    const needsCaptcha = trustScore <= 0.45; // Consistent with BALANCED threshold

    return NextResponse.json({
      success: true,
      trustScore: trustScore,
      trustLevel: trustLevel,
      needsCaptcha: needsCaptcha,
      lastUpdated: data?.updated_at || null,
    });

  } catch (error) {
    console.error('Get trust score API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function getTrustLevel(trustScore) {
  // VERY GENEROUS thresholds matching trustScoreAI.js
  if (trustScore >= 0.6) return 'high'; // Lowered from 0.7
  if (trustScore >= 0.4) return 'medium'; // Lowered from 0.5
  if (trustScore >= 0.25) return 'low'; // Lowered from 0.3
  return 'suspicious'; // Below 0.25
}