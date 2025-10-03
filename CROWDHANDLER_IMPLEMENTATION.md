# CrowdHandler Implementation Guide

## Overview

This guide covers the complete CrowdHandler integration for the Hacksphere train booking application. CrowdHandler provides virtual queue management to handle high traffic periods and protect your booking system from overload.

## 🚀 What's Been Implemented

### 1. Server-Side Middleware (`src/middleware.js`)
- **Queue validation** for protected routes (`/book`, `/api/demand/*`, `/api/queue/*`)
- **Hybrid mode** for optimal performance (2-10ms validation vs 20-100ms API calls)
- **Cookie management** for queue session continuity
- **Error handling** with fail-safe behavior (allows access if CrowdHandler API fails)

### 2. Client-Side Context (`src/context/CrowdHandlerContext.js`)
- **React context** for queue state management
- **SPA support** with lite validator integration
- **Performance tracking** for successful operations
- **Queue status refresh** functionality

### 3. Protected Route Component (`src/components/ProtectedRoute.js`)
- **Wrapper component** for pages requiring queue protection
- **Custom loading screens** and queue messaging
- **Automatic redirects** to waiting room when needed

### 4. API Protection (`src/app/api/crowdhandler/validate/route.js`)
- **Server-side validation** endpoint
- **Performance recording** API
- **Queue status checking** functionality

### 5. Queue Status Widget (`src/components/QueueStatusWidget.js`)
- **Visual indicator** of queue status
- **Customizable positioning** (top-right, top-left, etc.)
- **Manual refresh** capability
- **User-friendly messaging**

### 6. API Hooks (`src/hooks/useCrowdHandlerAPI.js`)
- **Protected API calls** with automatic queue validation
- **Performance tracking** for successful requests
- **Specialized demand forecasting** hook
- **Error handling** for queue-related issues

## 🔧 Configuration

### Environment Variables
```bash
# Server-side (required for middleware and API routes)
CROWDHANDLER_PUBLIC_KEY=5b945cd137a611051bdeeb272d26ec267875dc11c069b06199678e790160fbfd
CROWDHANDLER_PRIVATE_KEY=1ea8cc4eabeaf3bbc8ad39c7a5bca58224b8fae10b158631bf018bc1dacc1d2a

# Client-side (required for browser-side queue management)
NEXT_PUBLIC_CROWDHANDLER_PUBLIC_KEY=5b945cd137a611051bdeeb272d26ec267875dc11c069b06199678e790160fbfd
```

### Protected Routes
Currently protected:
- `/book` - Booking page (high-demand protection)
- `/api/demand/predict` - Demand prediction API
- `/api/queue/*` - Queue management APIs

### Queue Modes
- **Full Mode**: API validation on every request (simple, higher latency)
- **Hybrid Mode**: Local signature validation (complex, lower latency) ✅ **Currently Used**
- **Clientside Mode**: Browser-only validation (for static sites)

## 📖 Usage Examples

### 1. Protecting a Page
```jsx
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Your protected content here</div>
    </ProtectedRoute>
  );
}
```

### 2. Making Protected API Calls
```jsx
import { useCrowdHandlerAPI } from '@/hooks/useCrowdHandlerAPI';

function MyComponent() {
  const { post, loading, error } = useCrowdHandlerAPI();
  
  const handleSubmit = async (data) => {
    try {
      const result = await post('/api/some-endpoint', data);
      console.log('Success:', result);
    } catch (err) {
      console.error('Error:', err.message);
    }
  };
}
```

### 3. Demand Forecasting
```jsx
import { useDemandForecast } from '@/hooks/useCrowdHandlerAPI';

function ForecastComponent() {
  const { getForecast, loading, error } = useDemandForecast();
  
  const checkDemand = async () => {
    try {
      const forecast = await getForecast('2024-12-25', 'Jakarta-Surabaya', 2);
      console.log('Forecast:', forecast.prediction);
    } catch (err) {
      console.error('Forecast error:', err.message);
    }
  };
}
```

### 4. Queue Status Widget
```jsx
import QueueStatusWidget from '@/components/QueueStatusWidget';

function Layout() {
  return (
    <div>
      {/* Your content */}
      <QueueStatusWidget 
        position="top-right" 
        showWhenPromoted={true} 
      />
    </div>
  );
}
```

### 5. Using CrowdHandler Context
```jsx
import { useCrowdHandler } from '@/context/CrowdHandlerContext';

function MyComponent() {
  const { 
    isPromoted, 
    isLoading, 
    recordPerformance, 
    refreshQueueStatus 
  } = useCrowdHandler();
  
  useEffect(() => {
    if (isPromoted) {
      // User has access - can show premium features
      console.log('User is promoted');
    }
  }, [isPromoted]);
  
  const handleSuccess = async () => {
    // Record successful operation
    await recordPerformance({
      statusCode: 200,
      sample: 1.0 // Record 100% of these events
    });
  };
}
```

## 🎯 Key Features

### 1. Automatic Queue Management
- Users are automatically redirected to waiting room during high demand
- Queue position is maintained across page refreshes
- Seamless promotion when capacity is available

### 2. Performance Tracking
- Automatic performance recording for successful operations
- Configurable sampling rates (avoid overwhelming analytics)
- Helps CrowdHandler optimize queue flow

### 3. Fail-Safe Behavior
- If CrowdHandler API is unavailable, users get access (configurable)
- Graceful degradation ensures your app remains functional
- Error logging for debugging and monitoring

### 4. SPA Support
- Lite validator handles single-page application behavior
- Client-side queue validation for instant feedback
- Proper integration with React state management

## 🔍 Testing

### Development Testing
1. **Enable Debug Mode**: Set `NODE_ENV=development` to see detailed logs
2. **Test Queue Scenarios**: Manually trigger queue activation in CrowdHandler dashboard
3. **API Testing**: Use `/api/crowdhandler/validate` endpoint to test queue responses

### Production Monitoring
1. **Performance Metrics**: Monitor `recordPerformance()` calls in CrowdHandler analytics
2. **Error Tracking**: Watch for CrowdHandler errors in application logs
3. **Queue Analytics**: Review queue statistics in CrowdHandler dashboard

## 🛠️ Customization

### Custom Waiting Room
```jsx
function CustomWaitingRoom() {
  return (
    <div className="custom-queue-page">
      <h1>Please Wait</h1>
      <p>High demand detected - you're in line!</p>
      {/* Your custom queue experience */}
    </div>
  );
}

// Use in ProtectedRoute
<ProtectedRoute fallback={<CustomWaitingRoom />}>
  <YourContent />
</ProtectedRoute>
```

### Override Waiting Room URL
```jsx
// In a component or hook
const { gatekeeper } = useCrowdHandler();

useEffect(() => {
  if (gatekeeper) {
    gatekeeper.overrideWaitingRoomUrl('https://your-custom-queue.com');
  }
}, [gatekeeper]);
```

### Custom Cookie Name
```jsx
// In CrowdHandlerContext.js initialization
const { gatekeeper } = init({
  publicKey: process.env.NEXT_PUBLIC_CROWDHANDLER_PUBLIC_KEY,
  options: {
    mode: 'clientside',
    cookieName: 'your-custom-queue-cookie'
  }
});
```

## 📊 Analytics & Monitoring

### CrowdHandler Dashboard
- **Queue Analytics**: View queue length, wait times, promotion rates
- **Performance Metrics**: See how queue affects user experience
- **Room Configuration**: Adjust capacity, behavior, and appearance

### Custom Tracking
```jsx
// Track business events with queue context
const { isPromoted, recordPerformance } = useCrowdHandler();

const trackBookingSuccess = async (bookingData) => {
  // Your analytics
  analytics.track('booking_completed', {
    ...bookingData,
    was_queued: !isPromoted
  });
  
  // CrowdHandler performance tracking
  await recordPerformance({
    statusCode: 200,
    sample: 1.0,
    customData: { booking_id: bookingData.id }
  });
};
```

## 🚨 Troubleshooting

### Common Issues

1. **"Queue not working"**
   - Check environment variables are set correctly
   - Verify CrowdHandler room is active in dashboard
   - Check browser console for CrowdHandler errors

2. **"API calls failing"**
   - Ensure middleware is protecting the correct routes
   - Verify server-side environment variables
   - Check CrowdHandler API status

3. **"Infinite loading"**
   - Check if CrowdHandlerProvider wraps your app
   - Verify client-side public key is available
   - Look for JavaScript errors in browser console

### Debug Mode
Enable detailed logging:
```jsx
const { gatekeeper } = init({
  publicKey: process.env.NEXT_PUBLIC_CROWDHANDLER_PUBLIC_KEY,
  options: {
    debug: true, // Enable debug logging
    mode: 'clientside'
  }
});
```

## 🚀 Deployment Checklist

- [ ] Environment variables set in production
- [ ] CrowdHandler room configured and active
- [ ] Protected routes defined in middleware
- [ ] Error monitoring configured
- [ ] Performance tracking enabled
- [ ] Custom waiting room tested (if applicable)
- [ ] Mobile experience verified
- [ ] Load testing completed

## 📞 Support

- **CrowdHandler Documentation**: [Knowledge Base](https://www.crowdhandler.com/support)
- **API Reference**: [API Docs](https://admin.crowdhandler.com/account/api)
- **Technical Support**: support@crowdhandler.com

## 🔄 Next Steps

1. **Load Testing**: Test queue behavior under actual high load
2. **Custom Analytics**: Integrate queue metrics with your analytics platform
3. **A/B Testing**: Experiment with different queue configurations
4. **Mobile Optimization**: Ensure queue experience works well on mobile devices
5. **Multiple Rooms**: Consider separate queues for different product categories

---

*This implementation provides enterprise-grade queue management for your train booking platform. The system is designed to handle traffic spikes gracefully while maintaining an excellent user experience.*
