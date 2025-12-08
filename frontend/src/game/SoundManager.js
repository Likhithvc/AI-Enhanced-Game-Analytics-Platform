/**
 * Sound Manager for Game Audio
 * Generates and plays simple 8-bit style sound effects
 */

export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3;
    
    // Initialize audio context on first user interaction
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
      this.enabled = false;
    }
  }

  /**
   * Play jump sound - short upward beep
   */
  playJump() {
    if (!this.enabled || !this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Jump sound: quick rise from 400Hz to 600Hz
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    
    gainNode.gain.setValueAtTime(this.volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    oscillator.type = 'square';
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  /**
   * Play score sound - cheerful ding
   */
  playScore() {
    if (!this.enabled || !this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Score sound: pleasant ding at 800Hz
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
    
    gainNode.gain.setValueAtTime(this.volume * 0.8, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    oscillator.type = 'sine';
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  /**
   * Play collision/game over sound - dramatic crash
   */
  playCrash() {
    if (!this.enabled || !this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Create multiple oscillators for a richer crash sound
    for (let i = 0; i < 3; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Crash sound: descending noise from high to low frequencies
      const startFreq = 300 - (i * 50);
      const endFreq = 50;
      
      oscillator.frequency.setValueAtTime(startFreq, now);
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + 0.3);
      
      gainNode.gain.setValueAtTime(this.volume * 0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      oscillator.type = i === 0 ? 'sawtooth' : 'square';
      oscillator.start(now + (i * 0.02));
      oscillator.stop(now + 0.3);
    }
  }

  /**
   * Play start/restart sound - uplifting fanfare
   */
  playStart() {
    if (!this.enabled || !this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const notes = [
      { freq: 523.25, time: 0 },      // C
      { freq: 659.25, time: 0.1 },    // E
      { freq: 783.99, time: 0.2 }     // G
    ];
    
    notes.forEach(note => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(note.freq, now + note.time);
      
      gainNode.gain.setValueAtTime(this.volume * 0.5, now + note.time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.time + 0.15);
      
      oscillator.type = 'sine';
      oscillator.start(now + note.time);
      oscillator.stop(now + note.time + 0.15);
    });
  }

  /**
   * Toggle sound on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(level) {
    this.volume = Math.max(0, Math.min(1, level));
  }
}
