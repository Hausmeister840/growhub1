// Analyzes temporal patterns in user behavior for better predictions
class TemporalFeedAnalyzer {
  constructor() {
    this.patterns = {
      hourly: new Array(24).fill(0),
      daily: new Array(7).fill(0),
      contentByTime: {}
    };
  }

  // Record interaction timestamp
  recordInteraction(timestamp, contentType) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const day = date.getDay();

    this.patterns.hourly[hour]++;
    this.patterns.daily[day]++;

    if (!this.patterns.contentByTime[hour]) {
      this.patterns.contentByTime[hour] = {};
    }
    this.patterns.contentByTime[hour][contentType] = 
      (this.patterns.contentByTime[hour][contentType] || 0) + 1;
  }

  // Predict best time to show content
  predictOptimalTime(contentType) {
    const currentHour = new Date().getHours();
    
    // Find hours when user engages with this content type
    const scores = Object.entries(this.patterns.contentByTime)
      .map(([hour, types]) => ({
        hour: parseInt(hour),
        score: types[contentType] || 0
      }))
      .sort((a, b) => b.score - a.score);

    return scores[0]?.hour || currentHour;
  }

  // Get activity level for current time
  getCurrentActivityLevel() {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    const hourActivity = this.patterns.hourly[hour];
    const dayActivity = this.patterns.daily[day];
    
    const maxHourActivity = Math.max(...this.patterns.hourly);
    const maxDayActivity = Math.max(...this.patterns.daily);
    
    const hourScore = maxHourActivity > 0 ? hourActivity / maxHourActivity : 0;
    const dayScore = maxDayActivity > 0 ? dayActivity / maxDayActivity : 0;
    
    return (hourScore + dayScore) / 2;
  }

  // Predict next session time
  predictNextSession() {
    const currentHour = new Date().getHours();
    
    // Find next peak activity hour
    for (let i = 1; i <= 24; i++) {
      const checkHour = (currentHour + i) % 24;
      const activity = this.patterns.hourly[checkHour];
      
      if (activity > 0) {
        return {
          hour: checkHour,
          confidence: activity / Math.max(...this.patterns.hourly)
        };
      }
    }

    return { hour: currentHour, confidence: 0 };
  }

  // Analyze engagement windows
  getEngagementWindows() {
    const windows = [];
    let currentWindow = null;

    this.patterns.hourly.forEach((activity, hour) => {
      if (activity > 0) {
        if (!currentWindow) {
          currentWindow = { start: hour, end: hour, activity };
        } else {
          currentWindow.end = hour;
          currentWindow.activity += activity;
        }
      } else if (currentWindow) {
        windows.push(currentWindow);
        currentWindow = null;
      }
    });

    if (currentWindow) windows.push(currentWindow);

    return windows.sort((a, b) => b.activity - a.activity);
  }

  // Export patterns
  export() {
    return {
      hourly: this.patterns.hourly,
      daily: this.patterns.daily,
      contentByTime: this.patterns.contentByTime,
      activityLevel: this.getCurrentActivityLevel(),
      engagementWindows: this.getEngagementWindows()
    };
  }

  // Import patterns (for persistence)
  import(data) {
    if (data.hourly) this.patterns.hourly = data.hourly;
    if (data.daily) this.patterns.daily = data.daily;
    if (data.contentByTime) this.patterns.contentByTime = data.contentByTime;
  }
}

export const temporalAnalyzer = new TemporalFeedAnalyzer();