import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Zap,
  AlertCircle,
  BarChart3,
  Download,
  Settings,
  CheckCircle
} from 'lucide-react';

const JudicialLoadingOverlay = ({ 
  isVisible, 
  loadingType, 
  progress = 0,
  message = "Processing your request"
}) => {
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [displayMessage, setDisplayMessage] = useState(message);

  // Auto-increment progress for realistic effect
  useEffect(() => {
    if (!isVisible) {
      setCurrentProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentProgress(prev => {
        if (prev >= 95) return prev;
        const increment = Math.random() * 12;
        return Math.min(prev + increment, 95);
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Update message when prop changes
  useEffect(() => {
    setDisplayMessage(message);
  }, [message]);

  const getLoadingConfig = (type) => {
    const configs = {
      audit_trail: {
        title: 'Fetching Audit Trail',
        subtitle: 'Retrieving blockchain history...',
        Icon: FileText,
      },
      tampering_investigation: {
        title: 'Investigating Tampering',
        subtitle: 'Comparing blockchain vs database...',
        Icon: Search,
      },
      full_system_scan: {
        title: 'Running Full System Scan',
        subtitle: 'Verifying all blockchain entries...',
        Icon: Zap,
      },
      security_alerts: {
        title: 'Fetching Security Alerts',
        subtitle: 'Loading alert database...',
        Icon: AlertCircle,
      },
      blockchain_stats: {
        title: 'Loading Blockchain Stats',
        subtitle: 'Calculating integrity metrics...',
        Icon: BarChart3,
      },
      generating_report: {
        title: 'Generating Audit Trail Report',
        subtitle: 'Processing case data and compiling report...',
        Icon: Download,
      },
      case_manipulation: {
        title: 'Case Manipulation Detection',
        subtitle: 'Analyzing case changes...',
        Icon: Settings,
      },
      verification_details: {
        title: 'Loading Verification Details',
        subtitle: 'Fetching block information...',
        Icon: CheckCircle,
      }
    };
    return configs[type] || configs.audit_trail;
  };

  const config = getLoadingConfig(loadingType);
  const IconComponent = config.Icon;

  if (!isVisible) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    },
    modal: {
      backgroundColor: '#ffffff',
      borderRadius: '2px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      padding: '40px',
      width: '500px',
      border: '1px solid #e0e0e0'
    },
    iconContainer: {
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '24px'
    },
    iconCircle: {
      backgroundColor: '#f5f5f5',
      padding: '10px',
      borderRadius: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #d0d0d0'
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1a1a1a',
      textAlign: 'left',
      marginBottom: '6px',
      letterSpacing: '0.3px'
    },
    subtitle: {
      fontSize: '13px',
      color: '#666666',
      textAlign: 'left',
      marginTop: '4px',
      fontWeight: '400'
    },
    progressContainer: {
      marginBottom: '20px',
      marginTop: '32px'
    },
    progressBarWrapper: {
      width: '100%',
      height: '32px',
      backgroundColor: '#eeeeee',
      border: '1px solid #cccccc',
      borderRadius: '2px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#4a7c59',
      transition: 'width 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${currentProgress}%`,
      minWidth: currentProgress > 0 ? '2px' : '0px'
    },
    progressText: {
      color: '#ffffff',
      fontSize: '11px',
      fontWeight: '600',
      visibility: currentProgress > 15 ? 'visible' : 'hidden',
      paddingRight: '4px'
    },
    percentageDisplay: {
      textAlign: 'right',
      marginBottom: '16px'
    },
    percentageText: {
      color: '#333333',
      fontWeight: '500',
      fontSize: '13px'
    },
    messageContainer: {
      textAlign: 'left'
    },
    messageText: {
      color: '#333333',
      fontWeight: '500',
      fontSize: '13px',
      letterSpacing: '0.2px',
      margin: '0 0 8px 0'
    },
    hintText: {
      color: '#888888',
      fontSize: '12px',
      marginTop: '6px',
      fontWeight: '400',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    },
    dotsContainer: {
      display: 'flex',
      justifyContent: 'flex-start',
      gap: '3px',
      marginTop: '16px'
    },
    dot: {
      width: '6px',
      height: '6px',
      backgroundColor: '#999999',
      borderRadius: '50%',
      animation: 'bounce 1.4s infinite'
    }
  };

  return (
    <div style={styles.overlay}>
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-6px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 0.4; }
          }
        `}
      </style>
      <div style={styles.modal}>
        {/* Icon and Title */}
        <div style={styles.iconContainer}>
          <div style={styles.iconCircle}>
            <IconComponent size={28} color="#666666" />
          </div>
        </div>
        <h2 style={styles.title}>{config.title}</h2>
        <p style={styles.subtitle}>{config.subtitle}</p>

        {/* Progress Bar Container */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBarWrapper}>
            <div style={styles.progressBar}>
              <span style={styles.progressText}>{Math.floor(currentProgress)}%</span>
            </div>
          </div>
        </div>

        {/* Percentage Display */}
        <div style={styles.percentageDisplay}>
          <p style={styles.percentageText}>
            {Math.floor(currentProgress)}% Complete
          </p>
        </div>

        {/* Status Message */}
        <div style={styles.messageContainer}>
          <p style={styles.messageText}>
            {displayMessage}
          </p>
          <p style={styles.hintText}>
            Please wait, this may take a moment...
          </p>
        </div>

        {/* Loading Dots */}
        <div style={styles.dotsContainer}>
          <div style={{...styles.dot, animationDelay: '0ms'}}></div>
          <div style={{...styles.dot, animationDelay: '150ms'}}></div>
          <div style={{...styles.dot, animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
};

export default JudicialLoadingOverlay;