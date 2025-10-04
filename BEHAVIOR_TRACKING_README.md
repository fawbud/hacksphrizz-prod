# Comprehensive User Behavior Tracking & AI Trust Scoring System

## Overview

This system implements advanced bot detection and user trust scoring through comprehensive behavior analysis. It captures detailed user interactions and uses AI algorithms to determine whether a user is human or bot, generating trust scores that can trigger captcha verification when needed.

## 🚀 Features

### Behavior Tracking
- **Mouse Movement Analysis**: Position, velocity, acceleration, jitter patterns
- **Keystroke Pattern Recognition**: Timing intervals, rhythm analysis, dwell time
- **Form Interaction Monitoring**: Focus time, corrections, hesitation patterns
- **Click Behavior Analysis**: Accuracy, timing, target interaction
- **Scroll Pattern Detection**: Natural vs automated scrolling
- **Touch Event Support**: Mobile device interactions
- **Window Focus Tracking**: Tab switching, multitasking patterns

### AI Trust Scoring
- **Multi-Factor Analysis**: Combines 6 different behavioral metrics
- **Real-time Scoring**: Continuous evaluation during user interaction
- **Confidence Metrics**: Reliability indicators for trust scores
- **Pattern Recognition**: Detects bot-like suspicious behaviors
- **Adaptive Thresholds**: Configurable trust score requirements

### Security Integration
- **Automatic Captcha Triggering**: Shows captcha when trust score ≤ 0.5
- **Progressive Verification**: Multiple checkpoints during booking flow
- **Score Replacement Logic**: New scores replace old ones (not averaged)
- **Session Persistence**: Trust scores stored in database

## 📁 File Structure

```
src/
├── utils/
│   ├── behaviorTracker.js        # Main behavior tracking class
│   ├── trustScoreAI.js           # AI trust scoring algorithms
│   └── scoring.js                # Legacy scoring (for compatibility)
├── hooks/
│   └── useBehaviorTracking.js    # React hook for easy integration
├── components/
│   └── CaptchaPlaceholder.js     # Captcha UI component
├── app/
│   ├── api/behavior/track/
│   │   └── route.js              # API endpoint for behavior data
│   └── book/
│       └── page.js               # Enhanced booking page with tracking
└── public/
    └── test-behavior-tracking.js # Test utilities
```

## 🔧 Implementation

### 1. Database Setup

Run these SQL commands in your Supabase database:

```sql
-- Queue table for trust scores
CREATE TABLE IF NOT EXISTS queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  trust_score INTEGER DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
  trust_level VARCHAR(10) DEFAULT 'High' CHECK (trust_level IN ('High', 'Medium', 'Low')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Behavior logs for analysis
CREATE TABLE IF NOT EXISTS behavior_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES queue(user_id),
  metrics JSONB NOT NULL,
  trust_score INTEGER,
  trust_level VARCHAR(10),
  reasons TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add trust score to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trust_score INTEGER;
```

### 2. Basic Usage

```javascript
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';

function MyComponent() {
  const behaviorTracking = useBehaviorTracking(userId, {
    autoStart: true,
    sendInterval: 30000,
    onTrustScoreUpdate: (result) => {
      console.log('Trust score:', result.trustScore);
    },
    onCaptchaRequired: (result) => {
      showCaptcha();
    }
  });

  return (
    <div>
      {behaviorTracking.needsCaptcha && <CaptchaComponent />}
      <TrustScoreDisplay trustScore={behaviorTracking.currentTrustScore} />
    </div>
  );
}
```

### 3. Manual Tracking

```javascript
import { BehaviorTracker } from '@/utils/behaviorTracker';

const tracker = new BehaviorTracker(userId);
tracker.startTracking();

// Send data for analysis
const result = await tracker.sendToServer();
console.log('Trust score:', result.trustScore);

tracker.stopTracking();
```

## 🤖 AI Trust Scoring Algorithm

The system uses a weighted multi-factor analysis:

### Scoring Components
1. **Mouse Behavior (25%)**: Jitter, velocity variance, acceleration patterns
2. **Keystroke Patterns (25%)**: Timing consistency, dwell time, correction patterns
3. **Form Interactions (20%)**: Focus time, hesitation, correction frequency
4. **Temporal Patterns (15%)**: Session duration, interaction frequency
5. **Interaction Diversity (10%)**: Variety of interaction types
6. **Suspicious Patterns (5%)**: Known bot behaviors

### Trust Score Calculation
```
Final Score = (Human Factors × 0.7) + ((1 - Bot Factors) × 0.3)
Confidence = Data Quality × Pattern Consistency
```

### Thresholds
- **High Trust**: ≥ 0.8 (80%)
- **Medium Trust**: 0.5 - 0.79 (50-79%)
- **Low Trust**: < 0.5 (Below 50%) → Triggers Captcha

## 🔒 Security Features

### Bot Detection Patterns
- Perfectly straight mouse movements
- Too-consistent typing rhythms
- Impossibly fast interactions
- Lack of natural corrections
- No hesitation patterns
- Uniform scroll behaviors

### Human Indicators
- Natural mouse jitter
- Typing rhythm variations
- Mistake corrections
- Hesitation patterns
- Focus changes
- Acceleration variations

## 📊 Monitoring & Analytics

### Development Testing
```javascript
// In browser console
runAllTests(); // Comprehensive system test
```

### Production Monitoring
- Trust score distributions
- Captcha trigger rates
- Bot detection accuracy
- False positive analysis

## 🎯 Integration Points

### Booking Flow Integration
1. **Initial Check**: Trust score verification on booking start
2. **Progressive Monitoring**: Continuous analysis during form filling
3. **Step Validation**: Trust check between booking steps
4. **Final Verification**: Pre-submission captcha if needed

### CrowdHandler Integration
- Works alongside existing queue system
- Enhanced user verification
- Reduced server load from bots

## 🚨 Troubleshooting

### Common Issues

**Low Trust Scores for Real Users**
- Increase sample collection time
- Adjust sensitivity thresholds
- Check for accessibility tools interfering

**High False Positives**
- Review threshold settings
- Analyze user behavior patterns
- Consider device-specific adjustments

**API Errors**
- Check database connections
- Verify user ID format
- Review behavior data structure

### Debug Mode
Set `NODE_ENV=development` to enable:
- Detailed console logging
- Behavior tracking status display
- Debug information overlay

## 📈 Performance Considerations

### Client-Side
- Minimal performance impact (<1% CPU)
- Efficient data storage (automatic cleanup)
- Passive event listeners
- Optimized data transmission

### Server-Side
- Lightweight AI algorithms
- Efficient database queries
- Cached trust scores
- Background analysis processing

## 🔮 Future Enhancements

### Planned Features
- Machine learning model training
- Device fingerprinting
- Behavioral biometrics
- Real-time risk scoring
- Advanced captcha integration

### Analytics Dashboard
- Trust score trends
- Bot detection metrics
- User behavior insights
- Security event monitoring

## 📋 Configuration

### Environment Variables
```env
# Trust score thresholds
TRUST_SCORE_CAPTCHA_THRESHOLD=0.5
TRUST_SCORE_HIGH_THRESHOLD=0.8

# Behavior tracking settings
BEHAVIOR_TRACKING_ENABLED=true
BEHAVIOR_SEND_INTERVAL=30000

# Development settings
BEHAVIOR_DEBUG_MODE=false
```

### Customization Options
- Trust score thresholds
- Captcha trigger conditions
- Data collection intervals
- Sensitivity settings
- Device-specific rules

## 🛡️ Privacy & Compliance

### Data Collection
- No personally identifiable information
- Anonymized interaction patterns
- Configurable data retention
- GDPR-compliant logging

### User Transparency
- Clear privacy notices
- Opt-out mechanisms
- Data access requests
- Deletion capabilities

## 📞 Support

For implementation questions or issues:
1. Check the troubleshooting section
2. Review the test utilities
3. Enable debug mode for diagnostics
4. Analyze behavior logs for patterns

## 🔄 Version History

### v1.0.0 (Current)
- Initial implementation
- Comprehensive behavior tracking
- AI trust scoring
- Captcha integration
- React hooks
- API endpoints

---

*This system provides robust bot detection while maintaining excellent user experience for legitimate users.*