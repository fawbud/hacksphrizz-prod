# BehaviorTracker Trust Score Integration Guide

The `BehaviorTracker` has been enhanced to directly return trust scores and store them for easy access. This makes it simple to integrate with Supabase and other systems.

## 🎯 New Features

### 1. Trust Score Return Values
All methods that interact with the trust scoring system now return structured objects containing:

```javascript
{
  success: boolean,
  trustScore: number | null,        // 0.0 to 1.0 (0-100%)
  trustLevel: string | null,        // 'high', 'medium', 'low', 'very_low', 'bot_suspected'
  needsCaptcha: boolean,           // Whether to show captcha
  analysisMethod: string,          // 'rule_based_fallback', 'ai_analysis', etc.
  reasons: string[],               // Array of reason descriptions
  metadata: object,                // Additional analysis data
  error: string | null             // Error message if failed
}
```

### 2. Trust Score Storage
Trust scores are automatically stored in the tracking data for future reference:

```javascript
sessionMetrics: {
  lastTrustScore: number | null,
  lastTrustLevel: string | null,
  lastNeedsCaptcha: boolean | null,
  lastAnalysisTime: number | null,
  // ... other metrics
}
```

## 📚 API Reference

### Class Methods

#### `async getTrustScore()`
Performs fresh trust score analysis by calling the server.

```javascript
const tracker = new BehaviorTracker('user123');
const result = await tracker.getTrustScore();

console.log(result.trustScore);    // 0.75 (75%)
console.log(result.trustLevel);    // 'high'
console.log(result.needsCaptcha);  // false
```

#### `getLastTrustScore()`
Returns the last calculated trust score without making a server call.

```javascript
const cached = tracker.getLastTrustScore();

console.log(cached.trustScore);    // 0.75
console.log(cached.hasScore);      // true if score exists
console.log(cached.analysisTime);  // timestamp of last analysis
```

#### `async sendToServer(isBeforeUnload = false)`
Enhanced to return trust score along with send status.

```javascript
const result = await tracker.sendToServer();

console.log(result.success);       // true
console.log(result.trustScore);    // 0.82
console.log(result.method);        // 'fetch' or 'beacon'
```

### Singleton Methods

#### `behaviorTracker.init(userId)`
Initialize the singleton tracker.

```javascript
import { behaviorTracker } from './behaviorTracker.js';

const tracker = behaviorTracker.init('user123');
```

#### `async behaviorTracker.getTrustScore()`
Get trust score via singleton.

```javascript
const result = await behaviorTracker.getTrustScore();
```

#### `behaviorTracker.getLastTrustScore()`
Get cached trust score via singleton.

```javascript
const cached = behaviorTracker.getLastTrustScore();
```

## 🔗 Integration Examples

### Form Submission Integration

```javascript
import { behaviorTracker } from './utils/behaviorTracker.js';

async function handleFormSubmit(formData) {
  try {
    // Get trust score before submission
    const trustResult = await behaviorTracker.getTrustScore();
    
    if (!trustResult.success) {
      throw new Error('Trust analysis failed: ' + trustResult.error);
    }
    
    // Check if captcha is needed
    if (trustResult.needsCaptcha) {
      showCaptcha();
      return false; // Prevent submission until captcha completed
    }
    
    // Store in Supabase
    await supabase.from('user_trust_scores').insert({
      user_id: userId,
      trust_score: trustResult.trustScore,
      trust_level: trustResult.trustLevel,
      analysis_method: trustResult.analysisMethod,
      reasons: trustResult.reasons,
      form_data: formData,
      timestamp: new Date().toISOString()
    });
    
    // Proceed with form submission
    return submitForm(formData);
    
  } catch (error) {
    console.error('Form submission error:', error);
    // Fallback: show captcha on error
    showCaptcha();
    return false;
  }
}
```

### Checkout Process Integration

```javascript
import { behaviorTracker } from './utils/behaviorTracker.js';

class CheckoutForm {
  constructor() {
    this.tracker = behaviorTracker.init(this.userId);
  }
  
  async validateUser() {
    const result = await this.tracker.getTrustScore();
    
    return {
      isValid: result.success && !result.needsCaptcha,
      trustScore: result.trustScore,
      showCaptcha: result.needsCaptcha,
      reasons: result.reasons
    };
  }
  
  async processPayment(paymentData) {
    const validation = await this.validateUser();
    
    if (!validation.isValid) {
      if (validation.showCaptcha) {
        return { error: 'Captcha verification required' };
      } else {
        return { error: 'Security validation failed' };
      }
    }
    
    // Process payment with trust score context
    return await this.submitPayment({
      ...paymentData,
      trustScore: validation.trustScore,
      securityValidated: true
    });
  }
}
```

### Real-time Monitoring

```javascript
import { behaviorTracker } from './utils/behaviorTracker.js';

// Initialize tracker
const tracker = behaviorTracker.init('user123');

// Monitor trust score changes
setInterval(async () => {
  const cached = behaviorTracker.getLastTrustScore();
  
  if (cached.hasScore) {
    console.log('Current trust:', cached.trustScore);
    
    // Alert if trust score drops too low
    if (cached.trustScore < 0.3) {
      console.warn('Low trust score detected!');
      // Maybe show additional verification
    }
  }
}, 10000); // Check every 10 seconds
```

### Supabase Integration

```javascript
async function storeTrustScore(userId, trustResult) {
  if (!trustResult.success) {
    console.error('Cannot store failed trust analysis');
    return null;
  }
  
  const { data, error } = await supabase
    .from('behavior_trust_scores')
    .insert({
      user_id: userId,
      trust_score: Math.round(trustResult.trustScore * 100), // Store as 0-100
      trust_level: trustResult.trustLevel,
      needs_captcha: trustResult.needsCaptcha,
      analysis_method: trustResult.analysisMethod,
      reasons: trustResult.reasons,
      metadata: trustResult.metadata,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error storing trust score:', error);
    return null;
  }
  
  console.log('Trust score stored:', data);
  return data;
}

// Usage
const trustResult = await behaviorTracker.getTrustScore();
await storeTrustScore('user123', trustResult);
```

## ⚠️ Important Notes

1. **Beacon API Limitation**: When using `sendBeacon` (page unload), trust scores are not available due to API limitations.

2. **Minimum Interactions**: The tracker requires at least 5 interactions before analysis. Otherwise, it returns an error.

3. **Caching**: Trust scores are cached in the session. Use `getTrustScore()` for fresh analysis or `getLastTrustScore()` for cached values.

4. **Error Handling**: Always check the `success` field before using trust score values.

5. **Storage**: Trust scores are automatically stored in the tracker's session metrics for easy access.

## 🔄 Migration from Old Version

If you were using the old version, update your code as follows:

```javascript
// Old way
const result = await tracker.sendToServer();
// result only had success/error info

// New way
const result = await tracker.sendToServer();
console.log(result.trustScore);    // Now available!
console.log(result.trustLevel);    // Now available!
console.log(result.needsCaptcha);  // Now available!
```