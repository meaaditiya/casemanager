// ============================================================
// UPDATED socketService.js - Frontend Socket Service
// ============================================================
// Replace your existing socketService.js with this updated version

import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinCourt(court_no) {
    if (this.socket) {
      this.socket.emit('join_court', court_no);
      console.log(`Joined court: ${court_no}`);
    }
  }

  leaveCourt(court_no) {
    if (this.socket) {
      this.socket.emit('leave_court', court_no);
      console.log(`Left court: ${court_no}`);
    }
  }

  // ============================================================
  // EXISTING EVENT LISTENERS
  // ============================================================

  onScheduleUpdated(callback) {
    if (this.socket) {
      this.socket.on('schedule_updated', callback);
    }
  }

  onCaseStarted(callback) {
    if (this.socket) {
      this.socket.on('case_started', callback);
    }
  }

  onCaseEnded(callback) {
    if (this.socket) {
      this.socket.on('case_ended', callback);
    }
  }

  onCaseDismissed(callback) {
    if (this.socket) {
      this.socket.on('case_dismissed', callback);
    }
  }

  // ============================================================
  // NEW EVENT LISTENERS
  // ============================================================

  /**
   * Listen for hearing reopened events
   * Fired when a completed/dismissed hearing is reopened
   */
  onHearingReopened(callback) {
    if (this.socket) {
      this.socket.on('hearing_reopened', callback);
    }
  }

  /**
   * Listen for case removed events
   * Fired when a case is removed from the schedule
   */
  onCaseRemoved(callback) {
    if (this.socket) {
      this.socket.on('case_removed', callback);
    }
  }

  /**
   * Listen for timing updated events
   * Fired when a case's timing is manually changed
   */
  onTimingUpdated(callback) {
    if (this.socket) {
      this.socket.on('timing_updated', callback);
    }
  }

  /**
   * Listen for schedule conflicts
   * Fired when a time conflict is detected
   */
  onScheduleConflict(callback) {
    if (this.socket) {
      this.socket.on('schedule_conflict', callback);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    if (this.socket) {
      this.socket.off('schedule_updated');
      this.socket.off('case_started');
      this.socket.off('case_ended');
      this.socket.off('case_dismissed');
      this.socket.off('hearing_reopened');
      this.socket.off('case_removed');
      this.socket.off('timing_updated');
      this.socket.off('schedule_conflict');
    }
  }

  /**
   * Remove specific event listener
   */
  removeListener(eventName) {
    if (this.socket) {
      this.socket.off(eventName);
    }
  }

  /**
   * Emit a custom event (for future use)
   */
  emit(eventName, data) {
    if (this.socket) {
      this.socket.emit(eventName, data);
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

const socketService = new SocketService();
export default socketService;