// NEW FILE: blockchain/utils/securityAudit.js

const fs = require('fs').promises;
const path = require('path');

class SecurityAuditLogger {
  constructor() {
    this.logPath = path.join(__dirname, '../logs/security-audit.log');
  }

  async log(event) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity: event.severity || 'INFO',
      eventType: event.type,
      details: event.details,
      user: event.user || 'system',
      ipAddress: event.ipAddress || 'N/A',
      action: event.action || 'N/A'
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      // Ensure logs directory exists
      await fs.mkdir(path.dirname(this.logPath), { recursive: true });
      
      // Append to log file
      await fs.appendFile(this.logPath, logLine);

      // If CRITICAL, also console log
      if (event.severity === 'CRITICAL') {
        console.error('🚨 SECURITY AUDIT:', logEntry);
      }
    } catch (error) {
      console.error('Failed to write security audit log:', error);
    }
  }

  async logTamperingAttempt(details) {
    await this.log({
      severity: 'CRITICAL',
      type: 'TAMPERING_DETECTED',
      details,
      action: 'INVESTIGATE_IMMEDIATELY'
    });
  }

  async logVerificationFailure(blockIndex, details) {
    await this.log({
      severity: 'HIGH',
      type: 'VERIFICATION_FAILURE',
      details: {
        blockIndex,
        ...details
      },
      action: 'REVIEW_REQUIRED'
    });
  }

  async logUnauthorizedAccess(user, resource, ipAddress) {
    await this.log({
      severity: 'HIGH',
      type: 'UNAUTHORIZED_ACCESS',
      details: {
        user,
        resource,
        ipAddress
      },
      action: 'INVESTIGATE'
    });
  }

  async logCheckpointCreation(blockIndex, success) {
    await this.log({
      severity: success ? 'INFO' : 'CRITICAL',
      type: 'CHECKPOINT_CREATION',
      details: {
        blockIndex,
        success
      },
      action: success ? 'NONE' : 'INVESTIGATE_IMMEDIATELY'
    });
  }
}

module.exports = new SecurityAuditLogger();