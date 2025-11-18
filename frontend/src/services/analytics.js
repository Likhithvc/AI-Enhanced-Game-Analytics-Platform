/**
 * Analytics Service for Game Events
 * Batches events and sends them to the backend API
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BATCH_SIZE = 5;
const BATCH_TIMEOUT = 3000; // 3 seconds

class AnalyticsService {
  constructor() {
    this.eventQueue = [];
    this.batchTimer = null;
    this.userId = null;
    this.sessionId = null;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  /**
   * Track an event
   */
  trackEvent(eventType, eventName, payload = {}) {
    if (!this.userId) {
      console.warn('Analytics: User ID not set');
      return;
    }

    const event = {
      user_id: this.userId,
      session_id: this.sessionId,
      event_type: eventType,
      event_name: eventName,
      event_category: 'gameplay',
      payload: payload,
      timestamp: new Date().toISOString()
    };

    this.eventQueue.push(event);

    // Send immediately if batch size is reached
    if (this.eventQueue.length >= BATCH_SIZE) {
      this.flush();
    } else {
      // Otherwise, schedule a batch send
      this.scheduleBatch();
    }
  }

  /**
   * Schedule a batch send
   */
  scheduleBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.flush();
    }, BATCH_TIMEOUT);
  }

  /**
   * Send all queued events immediately
   */
  async flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // include Authorization header if token is stored
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${API_URL}/api/v1/events`, {
        events: eventsToSend
      }, { headers });
      
      console.log(`Analytics: Sent ${eventsToSend.length} events`, response.data);
      return response.data;
    } catch (error) {
      console.error('Analytics: Failed to send events', error);
      // Re-queue events on failure (optional)
      // this.eventQueue.unshift(...eventsToSend);
    }
  }

  /**
   * Start a new game session
   */
  async startSession(deviceInfo = {}) {
    if (!this.userId) {
      console.warn('Analytics: User ID not set');
      return null;
    }

    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${API_URL}/api/v1/sessions/start`, {
        user_id: this.userId,
        device_info: {
          ...deviceInfo,
          screen_width: window.innerWidth,
          screen_height: window.innerHeight,
          user_agent: navigator.userAgent
        },
        platform: 'web',
        game_version: '1.0.0'
      }, { headers });

      this.sessionId = response.data.id;
      console.log('Analytics: Session started', this.sessionId);
      
      // Track session_start event
      this.trackEvent('session', 'session_start', {
        session_id: this.sessionId
      });

      return this.sessionId;
    } catch (error) {
      console.error('Analytics: Failed to start session', error);
      return null;
    }
  }

  /**
   * End the current game session
   */
  async endSession(finalScore = 0) {
    if (!this.sessionId) {
      console.warn('Analytics: No active session');
      return;
    }

    // Track session_end event
    this.trackEvent('session', 'session_end', {
      final_score: finalScore
    });

    // Flush any remaining events
    await this.flush();

    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${API_URL}/api/v1/sessions/end`, {
        session_id: this.sessionId,
        final_score: finalScore
      }, { headers });

      console.log('Analytics: Session ended', response.data);
      this.sessionId = null;
      return response.data;
    } catch (error) {
      console.error('Analytics: Failed to end session', error);
    }
  }
}

export default new AnalyticsService();
