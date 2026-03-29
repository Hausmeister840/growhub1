// Advanced micro-interaction system for delightful UX
class MicroInteractionEngine {
  constructor() {
    this.hapticSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    this.soundEnabled = true;
    this.animations = new Map();
  }

  // Haptic feedback patterns
  haptic(pattern = 'light') {
    if (!this.hapticSupported || typeof navigator === 'undefined') return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 100, 50],
      notification: [10, 20, 10, 20, 10]
    };

    try {
      navigator.vibrate(patterns[pattern] || patterns.light);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Confetti effect for celebrations
  confetti(element) {
    if (!element || typeof document === 'undefined') return;

    const colors = ['#00FF88', '#00DD77', '#10B981', '#34D399'];
    const particles = 30;

    for (let i = 0; i < particles; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
      `;

      const rect = element.getBoundingClientRect();
      particle.style.left = rect.left + rect.width / 2 + 'px';
      particle.style.top = rect.top + rect.height / 2 + 'px';

      document.body.appendChild(particle);

      const angle = (Math.PI * 2 * i) / particles;
      const velocity = 100 + Math.random() * 100;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - 200;

      particle.animate([
        { 
          transform: 'translate(0, 0) scale(1)', 
          opacity: 1 
        },
        { 
          transform: `translate(${vx}px, ${vy}px) scale(0)`, 
          opacity: 0 
        }
      ], {
        duration: 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).onfinish = () => {
        particle.remove();
      };
    }
  }

  // Ripple effect
  ripple(element, event) {
    if (!element || typeof document === 'undefined') return;

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(0, 255, 136, 0.4);
      transform: translate(-50%, -50%);
      pointer-events: none;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    ripple.animate([
      { width: '0', height: '0', opacity: 1 },
      { width: '300px', height: '300px', opacity: 0 }
    ], {
      duration: 600,
      easing: 'ease-out'
    }).onfinish = () => {
      ripple.remove();
    };
  }

  // Magnetic button effect
  magneticEffect(button, event) {
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (event.clientX - centerX) * 0.3;
    const deltaY = (event.clientY - centerY) * 0.3;

    button.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }

  resetMagnetic(button) {
    if (!button) return;
    button.style.transform = '';
  }

  // Particle trail effect
  particleTrail(x, y) {
    if (typeof document === 'undefined') return;

    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 4px;
      height: 4px;
      background: linear-gradient(135deg, #00FF88, #00DD77);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9998;
    `;

    document.body.appendChild(particle);

    particle.animate([
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0)' }
    ], {
      duration: 500,
      easing: 'ease-out'
    }).onfinish = () => {
      particle.remove();
    };
  }

  // Glow pulse effect
  glowPulse(element, color = '#00FF88') {
    if (!element) return;

    const animation = element.animate([
      { boxShadow: `0 0 0 0 ${color}00` },
      { boxShadow: `0 0 20px 5px ${color}80` },
      { boxShadow: `0 0 0 0 ${color}00` }
    ], {
      duration: 1500,
      easing: 'ease-in-out'
    });

    this.animations.set(element, animation);
  }

  // Cleanup
  cleanup() {
    this.animations.forEach(animation => animation.cancel());
    this.animations.clear();
  }
}

export const microInteractions = new MicroInteractionEngine();

// Auto-cleanup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    microInteractions.cleanup();
  });
}