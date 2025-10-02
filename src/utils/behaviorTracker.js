/**
 * Frontend Behavior Tracker
 * Digunakan oleh Dev 1 untuk melacak perilaku user
 */

export class BehaviorTracker {
  constructor(userId) {
    this.userId = userId;
    this.data = {
      mouseData: {
        movements: [],
        clicks: [],
        avgSpeed: 0,
        variance: 0,
        totalDistance: 0,
        clickAccuracy: 0
      },
      typingData: {
        keystrokes: [],
        avgTimeBetweenKeys: 0,
        variance: 0,
        totalKeystrokes: 0,
        backspaceRatio: 0
      },
      gameData: {
        reactionTime: 0,
        accuracy: 0,
        consistency: 0,
        scores: []
      },
      sessionData: {
        timeOnPage: 0,
        interactionCount: 0,
        focusChanges: 0,
        startTime: Date.now()
      },
      deviceData: {
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      }
    };
    
    this.lastMouseTime = 0;
    this.lastKeyTime = 0;
    this.lastMousePos = { x: 0, y: 0 };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse tracking
    document.addEventListener('mousemove', this.trackMouseMovement.bind(this));
    document.addEventListener('click', this.trackMouseClick.bind(this));
    
    // Keyboard tracking
    document.addEventListener('keydown', this.trackKeypress.bind(this));
    
    // Focus tracking
    window.addEventListener('blur', this.trackFocusChange.bind(this));
    window.addEventListener('focus', this.trackFocusChange.bind(this));
    
    // Page unload tracking
    window.addEventListener('beforeunload', this.calculateSessionData.bind(this));
  }

  trackMouseMovement(event) {
    const now = Date.now();
    const pos = { x: event.clientX, y: event.clientY };
    
    if (this.lastMouseTime > 0) {
      const timeDiff = now - this.lastMouseTime;
      const distance = Math.sqrt(
        Math.pow(pos.x - this.lastMousePos.x, 2) + 
        Math.pow(pos.y - this.lastMousePos.y, 2)
      );
      
      if (timeDiff > 0) {
        const speed = distance / timeDiff * 1000; // pixels per second
        
        this.data.mouseData.movements.push({
          timestamp: now,
          position: pos,
          speed,
          distance
        });
        
        this.data.mouseData.totalDistance += distance;
      }
    }
    
    this.lastMouseTime = now;
    this.lastMousePos = pos;
    this.data.sessionData.interactionCount++;
  }

  trackMouseClick(event) {
    const target = event.target;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(event.clientX - centerX, 2) + 
      Math.pow(event.clientY - centerY, 2)
    );
    
    this.data.mouseData.clicks.push({
      timestamp: Date.now(),
      position: { x: event.clientX, y: event.clientY },
      target: target.tagName,
      accuracy: Math.max(0, 1 - (distance / 50)) // Normalized accuracy
    });
    
    this.data.sessionData.interactionCount++;
  }

  trackKeypress(event) {
    const now = Date.now();
    
    if (this.lastKeyTime > 0) {
      const timeDiff = now - this.lastKeyTime;
      
      this.data.typingData.keystrokes.push({
        timestamp: now,
        key: event.key,
        timeBetweenKeys: timeDiff,
        isBackspace: event.key === 'Backspace'
      });
    }
    
    this.lastKeyTime = now;
    this.data.sessionData.interactionCount++;
  }

  trackFocusChange() {
    this.data.sessionData.focusChanges++;
  }

  updateGameData(gameMetrics) {
    this.data.gameData = { ...this.data.gameData, ...gameMetrics };
  }

  calculateSessionData() {
    this.data.sessionData.timeOnPage = Date.now() - this.data.sessionData.startTime;
  }

  generateMetrics() {
    this.calculateSessionData();
    this.calculateMouseMetrics();
    this.calculateTypingMetrics();
    
    return {
      mouseData: this.data.mouseData,
      typingData: this.data.typingData,
      gameData: this.data.gameData,
      sessionData: this.data.sessionData,
      deviceData: this.data.deviceData
    };
  }

  calculateMouseMetrics() {
    const movements = this.data.mouseData.movements;
    if (movements.length === 0) return;
    
    // Calculate average speed
    const speeds = movements.map(m => m.speed).filter(s => s > 0);
    this.data.mouseData.avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    
    // Calculate speed variance
    const avgSpeed = this.data.mouseData.avgSpeed;
    const variance = speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length;
    this.data.mouseData.variance = Math.sqrt(variance);
    
    // Calculate click accuracy
    const clicks = this.data.mouseData.clicks;
    if (clicks.length > 0) {
      this.data.mouseData.clickAccuracy = clicks.reduce((sum, click) => sum + click.accuracy, 0) / clicks.length;
    }
  }

  calculateTypingMetrics() {
    const keystrokes = this.data.typingData.keystrokes;
    if (keystrokes.length === 0) return;
    
    this.data.typingData.totalKeystrokes = keystrokes.length;
    
    // Calculate average time between keys
    const times = keystrokes.map(k => k.timeBetweenKeys).filter(t => t > 0);
    if (times.length > 0) {
      this.data.typingData.avgTimeBetweenKeys = times.reduce((a, b) => a + b, 0) / times.length;
      
      // Calculate variance
      const avgTime = this.data.typingData.avgTimeBetweenKeys;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
      this.data.typingData.variance = Math.sqrt(variance);
    }
    
    // Calculate backspace ratio
    const backspaceCount = keystrokes.filter(k => k.isBackspace).length;
    this.data.typingData.backspaceRatio = backspaceCount / keystrokes.length;
  }

  async sendToServer() {
    try {
      const metrics = this.generateMetrics();
      
      const response = await fetch('/api/behavior/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          metrics
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending behavior data:', error);
      return null;
    }
  }

  // Method untuk periodic sending (bisa dipanggil setiap 30 detik)
  startPeriodicTracking(intervalMs = 30000) {
    return setInterval(() => {
      this.sendToServer();
    }, intervalMs);
  }
}

// Utility functions untuk Dev 1
export function initializeBehaviorTracking(userId) {
  return new BehaviorTracker(userId);
}

export async function sendGameScore(userId, gameMetrics) {
  try {
    const response = await fetch('/api/behavior/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        metrics: { gameData: gameMetrics }
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending game score:', error);
    return null;
  }
}