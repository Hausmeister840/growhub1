// Predicts when user wants to see notifications
class PredictiveNotificationEngine {
  constructor() {
    this.userPatterns = {
      activeHours: new Array(24).fill(0),
      notificationPreference: 'smart',
      doNotDisturbRules: []
    };
    this.pendingNotifications = [];
  }

  // Learn from user behavior
  recordNotificationInteraction(timestamp, interacted) {
    const hour = new Date(timestamp).getHours();
    
    if (interacted) {
      this.userPatterns.activeHours[hour] += 2;
    } else {
      this.userPatterns.activeHours[hour] = Math.max(0, this.userPatterns.activeHours[hour] - 1);
    }
  }

  // Predict best time to send notification
  predictBestTime() {
    const currentHour = new Date().getHours();
    const currentScore = this.userPatterns.activeHours[currentHour];
    
    // Find next peak hour
    for (let i = 0; i < 24; i++) {
      const checkHour = (currentHour + i) % 24;
      const score = this.userPatterns.activeHours[checkHour];
      
      if (score > currentScore * 1.5) {
        return {
          hour: checkHour,
          confidence: score / Math.max(...this.userPatterns.activeHours),
          shouldDelay: i > 0
        };
      }
    }

    return {
      hour: currentHour,
      confidence: 1,
      shouldDelay: false
    };
  }

  // Queue notification for optimal delivery
  queueNotification(notification) {
    const prediction = this.predictBestTime();
    
    if (prediction.shouldDelay && prediction.confidence > 0.7) {
      this.pendingNotifications.push({
        ...notification,
        scheduledFor: prediction.hour
      });
      return false; // Don't show now
    }

    return true; // Show immediately
  }

  // Check for due notifications
  checkPendingNotifications() {
    const currentHour = new Date().getHours();
    const due = this.pendingNotifications.filter(n => n.scheduledFor === currentHour);
    
    this.pendingNotifications = this.pendingNotifications.filter(n => n.scheduledFor !== currentHour);
    
    return due;
  }

  // Set Do Not Disturb rules
  setDNDRule(startHour, endHour) {
    this.userPatterns.doNotDisturbRules.push({ startHour, endHour });
  }

  isInDNDPeriod() {
    const currentHour = new Date().getHours();
    
    return this.userPatterns.doNotDisturbRules.some(rule => {
      if (rule.startHour < rule.endHour) {
        return currentHour >= rule.startHour && currentHour < rule.endHour;
      } else {
        return currentHour >= rule.startHour || currentHour < rule.endHour;
      }
    });
  }
}

export const predictiveNotifications = new PredictiveNotificationEngine();