import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, Users, AlertCircle, CheckCircle, XCircle, Maximize2, Minimize2 } from 'lucide-react';
import socketService from '../services/socketService';
import { getPublicSchedule } from '../services/scheduleApi';
import '../ComponentsCSS/LitigantLiveDashboard.css';

const LitigantLiveDashboard = ({ litigantId }) => {
  const [myCases, setMyCases] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]); // NEW: Store all court schedules
  const [allCourtNumbers, setAllCourtNumbers] = useState([]); // NEW: Track all courts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false); // NEW: Fullscreen state

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchMyCases();
  }, [litigantId]);

  useEffect(() => {
    // NEW: Join ALL courts that have user's cases
    if (allCourtNumbers.length > 0) {
      socketService.connect();
      
      // Join all courts
      allCourtNumbers.forEach(courtNo => {
        socketService.joinCourt(courtNo);
      });
      
      setupSocketListeners();
    }

    return () => {
      // Leave all courts on cleanup
      if (allCourtNumbers.length > 0) {
        allCourtNumbers.forEach(courtNo => {
          socketService.leaveCourt(courtNo);
        });
        socketService.removeAllListeners();
      }
    };
  }, [allCourtNumbers]);

  const fetchMyCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cases/litigant', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch cases');

      const data = await response.json();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      console.log('All user cases:', data.cases);
      
      const todaysCases = data.cases.filter(c => {
        if (!c.hearings || c.hearings.length === 0) return false;
        
        return c.hearings.some(h => {
          const hearingDate = new Date(h.next_hearing_date);
          hearingDate.setHours(0, 0, 0, 0);
          const hearingDateStr = hearingDate.toISOString().split('T')[0];
          
          console.log(`Case ${c.case_num}:`, {
            next_hearing_date: h.next_hearing_date,
            hearingDateStr,
            todayStr,
            isToday: hearingDateStr === todayStr,
            is_listed_for_today: h.is_listed_for_today,
            court_no: h.court_no
          });
          
          return hearingDateStr === todayStr && h.is_listed_for_today === true;
        });
      });

      console.log('Filtered cases for today:', todaysCases);
      setMyCases(todaysCases);
      
      // NEW: Extract ALL unique court numbers from today's cases
      const uniqueCourts = [...new Set(
        todaysCases.flatMap(caseItem => 
          caseItem.hearings
            .filter(h => {
              const hearingDate = new Date(h.next_hearing_date);
              hearingDate.setHours(0, 0, 0, 0);
              const todayDate = new Date();
              todayDate.setHours(0, 0, 0, 0);
              return hearingDate.toISOString().split('T')[0] === todayDate.toISOString().split('T')[0] && 
                     h.is_listed_for_today && 
                     h.court_no;
            })
            .map(h => h.court_no)
        )
      )];

      console.log('Unique courts with today\'s cases:', uniqueCourts);
      setAllCourtNumbers(uniqueCourts);

      // NEW: Load schedules for ALL courts
      if (uniqueCourts.length > 0) {
        await loadAllSchedules(uniqueCourts);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Load schedules for all courts
  const loadAllSchedules = async (courtNumbers) => {
    try {
      const schedulePromises = courtNumbers.map(courtNo => 
        getPublicSchedule(courtNo).catch(err => {
          console.error(`Error loading schedule for court ${courtNo}:`, err);
          return null;
        })
      );

      const schedules = await Promise.all(schedulePromises);
      
      // Filter out null values and add court_no to each schedule if not present
      const validSchedules = schedules.filter(s => s !== null).map((schedule, index) => ({
        ...schedule,
        court_no: schedule.court_no || courtNumbers[index]
      }));

      console.log('Loaded schedules for all courts:', validSchedules);
      setAllSchedules(validSchedules);
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError(err.message);
    }
  };

  const setupSocketListeners = () => {
    socketService.onScheduleUpdated((data) => {
      // Reload schedule for the updated court
      if (allCourtNumbers.includes(data.court_no)) {
        loadAllSchedules(allCourtNumbers);
        addNotification(`Schedule updated for Court ${data.court_no}`, 'info');
      }
    });

    socketService.onCaseStarted((data) => {
      if (allCourtNumbers.includes(data.court_no)) {
        loadAllSchedules(allCourtNumbers);
        
        const isMyCase = myCases.some(c => c.case_num === data.case_num);
        if (isMyCase) {
          addNotification(`Your case ${data.case_num} has started in Court ${data.court_no}!`, 'success');
          playNotificationSound();
        }
      }
    });

    socketService.onCaseEnded((data) => {
      if (allCourtNumbers.includes(data.court_no)) {
        loadAllSchedules(allCourtNumbers);
        
        const isMyCase = myCases.some(c => c.case_num === data.case_num);
        if (isMyCase) {
          addNotification(`Your case ${data.case_num} has been completed`, 'info');
        }
      }
    });

    socketService.onCaseDismissed((data) => {
      if (allCourtNumbers.includes(data.court_no)) {
        loadAllSchedules(allCourtNumbers);
        
        const isMyCase = myCases.some(c => c.case_num === data.case_num);
        if (isMyCase) {
          addNotification(`Your case ${data.case_num} has been dismissed`, 'warning');
        }
      }
    });
  };

  const addNotification = (message, type) => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 5));
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio not available');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusInfo = (status) => {
    const statusConfig = {
      scheduled: {
        icon: Clock,
        color: '#fbbf24',
        bgColor: '#fef3c7',
        text: 'Scheduled'
      },
      in_progress: {
        icon: CheckCircle,
        color: '#10b981',
        bgColor: '#d1fae5',
        text: 'In Progress'
      },
      completed: {
        icon: CheckCircle,
        color: '#6b7280',
        bgColor: '#f3f4f6',
        text: 'Completed'
      },
      dismissed: {
        icon: XCircle,
        color: '#ef4444',
        bgColor: '#fee2e2',
        text: 'Dismissed'
      },
      adjourned: {
        icon: Calendar,
        color: '#f59e0b',
        bgColor: '#fef3c7',
        text: 'Adjourned'
      }
    };
    
    return statusConfig[status] || statusConfig.scheduled;
  };

  // NEW: Get all cases from all schedules, sorted chronologically
  const getAllCasesSorted = () => {
    const allCases = [];
    
    allSchedules.forEach(schedule => {
      if (schedule && schedule.scheduled_cases) {
        schedule.scheduled_cases.forEach(schedCase => {
          allCases.push({
            ...schedCase,
            court_no: schedule.court_no // Ensure court_no is included
          });
        });
      }
    });

    // Sort by listing_time_start chronologically
    return allCases.sort((a, b) => 
      new Date(a.listing_time_start) - new Date(b.listing_time_start)
    );
  };

  // NEW: Get current case across all courts
  const getCurrentCase = () => {
    const allCases = getAllCasesSorted();
    return allCases.find(c => c.status === 'in_progress');
  };

  // NEW: Get upcoming cases across all courts
  const getUpcomingCases = () => {
    const allCases = getAllCasesSorted();
    return allCases.filter(c => c.status === 'scheduled');
  };

  // NEW: Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const elem = document.getElementById('litdash-fullscreen-container');
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const currentCase = getCurrentCase();
  const allSortedCases = getAllCasesSorted();

  if (loading && myCases.length === 0) {
    return (
      <div className="litdash-loading">
        <div className="litdash-spinner"></div>
        <p>Loading your schedule...</p>
      </div>
    );
  }

  return (
    <div className="litdash-container" id="litdash-fullscreen-container">
      <div className="litdash-header">
        <div className="litdash-header-content">
          <h1 className="litdash-title">Live Court Schedule Dashboard</h1>
          <div className="litdash-current-time">
            <Clock size={16} />
            <span>{currentTime.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}</span>
          </div>
        </div>
        {allCourtNumbers.length > 0 && (
          <div className="litdash-courts-info">
            <MapPin size={16} />
            <span>Monitoring Courts: {allCourtNumbers.join(', ')}</span>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="litdash-notifications">
          {notifications.map(notification => (
            <div key={notification.id} className={`litdash-notification litdash-notification-${notification.type}`}>
              <AlertCircle size={16} />
              <span>{notification.message}</span>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="litdash-notification-close"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="litdash-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* My Cases Section */}
      <div className="litdash-my-cases-section">
        <h2 className="litdash-section-title">
          <Users size={18} />
          Your Cases Today ({myCases.length})
        </h2>
        
        {myCases.length === 0 ? (
          <div className="litdash-no-cases">
            <p>You have no cases scheduled for today</p>
          </div>
        ) : (
          <div className="litdash-my-cases-grid">
            {myCases.map(caseItem => {
              // Find this case in all schedules
              let myCase = null;
              let courtNo = null;
              
              for (const schedule of allSchedules) {
                const found = schedule.scheduled_cases?.find(sc => sc.case_num === caseItem.case_num);
                if (found) {
                  myCase = found;
                  courtNo = schedule.court_no;
                  break;
                }
              }

              if (!myCase) return null;

              const statusInfo = getStatusInfo(myCase.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={caseItem.case_num} className="litdash-my-case-card">
                  <div className="litdash-case-card-header">
                    <div className="litdash-case-number-badge">{caseItem.case_num}</div>
                    <div 
                      className="litdash-case-status-badge"
                      style={{ 
                        backgroundColor: statusInfo.bgColor,
                        color: statusInfo.color 
                      }}
                    >
                      <StatusIcon size={14} />
                      <span>{statusInfo.text}</span>
                    </div>
                  </div>

                  <div className="litdash-case-details-grid">
                    <div className="litdash-detail-item">
                      <span className="litdash-detail-label">Court No</span>
                      <span className="litdash-detail-value">{courtNo}</span>
                    </div>

                    <div className="litdash-detail-item">
                      <span className="litdash-detail-label">Case Type</span>
                      <span className="litdash-detail-value">{caseItem.case_type}</span>
                    </div>

                    <div className="litdash-detail-item">
                      <span className="litdash-detail-label">Scheduled Time</span>
                      <span className="litdash-detail-value">
                        {formatTime(myCase.listing_time_start)} - {formatTime(myCase.listing_time_end)}
                      </span>
                    </div>

                    {myCase.status === 'in_progress' && (
                      <div className="litdash-detail-item litdash-current-case-indicator">
                        <span className="litdash-pulse-dot"></span>
                        <span className="litdash-detail-value">Your case is now in progress!</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Currently in Court Section */}
      <div className="litdash-current-case-section">
        <h2 className="litdash-section-title">
          <CheckCircle size={18} />
          Currently in Court
        </h2>

        {currentCase ? (
          <div className="litdash-current-case-display">
            <div className="litdash-current-case-content">
              <div className="litdash-case-header-row">
                <div className="litdash-case-number-large">{currentCase.case_num}</div>
                <div className="litdash-court-badge">Court {currentCase.court_no}</div>
                <div className="litdash-live-indicator">
                  <span className="litdash-pulse-dot"></span>
                  <span>LIVE</span>
                </div>
              </div>

              <div className="litdash-case-info-row">
                <div className="litdash-info-column">
                  <span className="litdash-info-label">Case Type</span>
                  <span className="litdash-info-value">{currentCase.case_type}</span>
                </div>
                
                <div className="litdash-info-column">
                  <span className="litdash-info-label">Plaintiff</span>
                  <span className="litdash-info-value">{currentCase.plaintiff_name}</span>
                </div>
                
                <div className="litdash-info-column">
                  <span className="litdash-info-label">Respondent</span>
                  <span className="litdash-info-value">{currentCase.respondent_name}</span>
                </div>
              </div>

              {currentCase.actual_start_time && (
                <div className="litdash-time-elapsed">
                  Started at {formatTime(currentCase.actual_start_time)} • 
                  {Math.floor((currentTime - new Date(currentCase.actual_start_time)) / 1000 / 60)} minutes elapsed
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="litdash-no-current-case">
            <p>No court is currently in session</p>
          </div>
        )}
      </div>

      {/* Full Schedule Section with Fullscreen Button */}
      <div className="litdash-schedule-section">
        <div className="litdash-schedule-header">
          <h2 className="litdash-section-title">
            <Calendar size={18} />
            Complete Schedule - All Courts ({allSortedCases.length} cases)
          </h2>
          <button 
            onClick={toggleFullscreen} 
            className="litdash-fullscreen-btn"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>

        {allSortedCases.length > 0 ? (
          <div className="litdash-schedule-table-wrapper">
            <table className="litdash-schedule-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Court No</th>
                  <th>Time</th>
                  <th>Case Number</th>
                  <th>Case Type</th>
                  <th>Parties</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allSortedCases.map((schedCase, index) => {
                  const statusInfo = getStatusInfo(schedCase.status);
                  const StatusIcon = statusInfo.icon;
                  const isMyCase = myCases.some(c => c.case_num === schedCase.case_num);

                  return (
                    <tr 
                      key={`${schedCase.court_no}-${schedCase.case_num}`} 
                      className={`litdash-schedule-row ${isMyCase ? 'litdash-my-case-row' : ''} ${schedCase.status === 'in_progress' ? 'litdash-active-row' : ''}`}
                    >
                      <td className="litdash-table-index">{index + 1}</td>
                      <td className="litdash-table-court">
                        <strong>{schedCase.court_no}</strong>
                      </td>
                      <td className="litdash-table-time">
                        {formatTime(schedCase.listing_time_start)} - {formatTime(schedCase.listing_time_end)}
                      </td>
                      <td className="litdash-table-case-num">
                        {schedCase.case_num}
                        {isMyCase && (
                          <span className="litdash-my-case-tag">Your Case</span>
                        )}
                      </td>
                      <td className="litdash-table-case-type">{schedCase.case_type}</td>
                      <td className="litdash-table-parties">
                        <div className="litdash-party-names">
                          <div><strong>P:</strong> {schedCase.plaintiff_name}</div>
                          <div><strong>R:</strong> {schedCase.respondent_name}</div>
                        </div>
                      </td>
                      <td className="litdash-table-duration">{schedCase.estimated_duration} min</td>
                      <td>
                        <div 
                          className="litdash-table-status"
                          style={{ 
                            backgroundColor: statusInfo.bgColor,
                            color: statusInfo.color 
                          }}
                        >
                          <StatusIcon size={12} />
                          <span>{statusInfo.text}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="litdash-no-schedule">
            <p>No cases scheduled across any court for today</p>
          </div>
        )}
      </div>

      <div className="litdash-instructions-section">
        <h3 className="litdash-instructions-title">📌 Important Instructions</h3>
        <ul className="litdash-instructions-list">
          <li>Please arrive at least 15 minutes before your scheduled time</li>
          <li>Times may change based on actual hearing durations - keep this page open for updates</li>
          <li>You will receive notifications when your case is approaching</li>
          <li>Check the Court No column to know which courtroom to attend</li>
          <li>Use the Fullscreen button for better visibility of the complete schedule</li>
          <li>Listen for announcements in the court premises</li>
          <li>Contact court staff if you have any questions about your hearing</li>
        </ul>
      </div>
    </div>
  );
};

export default LitigantLiveDashboard;