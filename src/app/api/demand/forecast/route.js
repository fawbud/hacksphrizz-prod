import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, route, passengers = 1 } = body;

    if (!date || !route) {
      return NextResponse.json(
        { error: 'Date and route are required' },
        { status: 400 }
      );
    }

    // For now, skip CrowdHandler validation in API routes to avoid Edge Runtime issues
    // The client-side protection will handle queue management
    
    // Simulate demand prediction logic
    // In a real implementation, this would call your ML model
    const baseLoad = Math.random() * 0.8 + 0.1; // 10-90% base load
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const hour = dateObj.getHours();
    
    // Higher demand on weekends and during peak hours (7-9 AM, 5-7 PM)
    let demandMultiplier = 1;
    if (isWeekend) demandMultiplier *= 1.3;
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      demandMultiplier *= 1.5;
    }

    const predictedLoad = Math.min(baseLoad * demandMultiplier, 1);
    const recommendation = predictedLoad > 0.8 ? 'high' : predictedLoad > 0.5 ? 'medium' : 'low';

    return NextResponse.json({
      success: true,
      prediction: {
        demand: recommendation,
        loadPercentage: Math.round(predictedLoad * 100),
        recommendedAction: recommendation === 'high' 
          ? 'Book early - High demand expected'
          : recommendation === 'medium'
          ? 'Moderate demand - Good time to book'
          : 'Low demand - Flexible booking available'
      },
      meta: {
        date,
        route,
        passengers,
        requestTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Demand forecast API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
