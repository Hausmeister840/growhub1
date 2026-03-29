class VideoPlaybackManager {
  constructor() {
    this.currentVideo = null;
    this.observers = new Map();
  }

  register(videoElement, onVisible, onHidden) {
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
          this.play(videoElement, onVisible);
        } else {
          this.pause(videoElement, onHidden);
        }
      },
      {
        threshold: [0, 0.75, 1.0],
        rootMargin: '0px'
      }
    );

    observer.observe(videoElement);
    this.observers.set(videoElement, observer);

    return () => {
      this.unregister(videoElement);
    };
  }

  unregister(videoElement) {
    const observer = this.observers.get(videoElement);
    if (observer) {
      observer.disconnect();
      this.observers.delete(videoElement);
    }
    
    if (this.currentVideo === videoElement) {
      this.currentVideo = null;
    }
  }

  async play(videoElement, callback) {
    if (this.currentVideo && this.currentVideo !== videoElement) {
      this.currentVideo.pause();
    }

    this.currentVideo = videoElement;

    try {
      await videoElement.play();
      callback?.();
    } catch (err) {
      console.log('Video play prevented:', err);
    }
  }

  pause(videoElement, callback) {
    if (videoElement && !videoElement.paused) {
      videoElement.pause();
      callback?.();
    }
    
    if (this.currentVideo === videoElement) {
      this.currentVideo = null;
    }
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    if (this.currentVideo) {
      this.currentVideo.pause();
      this.currentVideo = null;
    }
  }
}

const videoPlaybackManager = new VideoPlaybackManager();
export default videoPlaybackManager;