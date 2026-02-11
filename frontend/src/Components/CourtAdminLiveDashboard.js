import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, XCircle, Calendar, Edit2, RotateCcw, Trash2, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import socketService from '../services/socketService';
import { 
  getTodaySchedule, 
  startHearing, 
  endHearing, 
  dismissHearing,
  getCasesForListing,
  createListing,
  updateCaseTiming,
  reopenHearing,
  removeCaseFromSchedule,
  validateTimeSlot,
  getSuggestedTimeSlots
} from '../services/scheduleApi';
import '../ComponentsCSS/CourtAdminLiveDashboard.css';

const CourtAdminLiveDashboard = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [courtNo, setCourtNo] = useState('');
  const [adminProfile, setAdminProfile] = useState(null);
  
  // Scheduling form states
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [availableCases, setAvailableCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  
  // Manual time picker states
  const [schedulingMode, setSchedulingMode] = useState('auto');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [timeConflict, setTimeConflict] = useState(null);

  // Edit timing states
  const [editingCase, setEditingCase] = useState(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [cascadeUpdates, setCascadeUpdates] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  useEffect(() => {
    if (courtNo) {
      loadSchedule();
      socketService.connect();
      socketService.joinCourt(courtNo);
      setupSocketListeners();
    }

    return () => {
      if (courtNo) {
        socketService.leaveCourt(courtNo);
        socketService.removeAllListeners();
      }
    };
  }, [courtNo]);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/courtadmin/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch admin profile');

      const data = await response.json();
      const profileData = data.admin || data;
      setAdminProfile(profileData);
      
      if (profileData.court_no) {
        setCourtNo(profileData.court_no);
      } else if (profileData.court_name) {
        setCourtNo(profileData.court_name);
      } else if (profileData.courtNo) {
        setCourtNo(profileData.courtNo);
      } else {
        setError('Court number not found in your profile.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.onScheduleUpdated((data) => {
      if (data.court_no === courtNo) {
        loadSchedule();
        showSuccess('Schedule updated in real-time');
      }
    });

    socketService.onCaseStarted((data) => {
      if (data.court_no === courtNo) loadSchedule();
    });

    socketService.onCaseEnded((data) => {
      if (data.court_no === courtNo) loadSchedule();
    });

    socketService.onCaseDismissed((data) => {
      if (data.court_no === courtNo) loadSchedule();
    });

    socketService.socket?.on('hearing_reopened', (data) => {
      if (data.court_no === courtNo) {
        loadSchedule();
        showSuccess(`Hearing ${data.case_num} reopened`);
      }
    });

    socketService.socket?.on('case_removed', (data) => {
      if (data.court_no === courtNo) {
        loadSchedule();
        showSuccess(`Case ${data.case_num} removed from schedule`);
      }
    });
  };

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await getTodaySchedule(courtNo);
      setSchedule(data);
      setError(null);
    } catch (err) {
      console.error('Error loading schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCases = async () => {
    try {
      const response = await getCasesForListing();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const casesForToday = response.cases.filter(c => {
        if (!c.hearings || c.hearings.length === 0) return false;
        
        return c.hearings.some(h => {
          const hearingDate = new Date(h.next_hearing_date);
          hearingDate.setHours(0, 0, 0, 0);
          const hearingDateStr = hearingDate.toISOString().split('T')[0];
          return hearingDateStr === todayStr && !h.is_listed_for_today;
        });
      });
      
      setAvailableCases(casesForToday);
      
      if (casesForToday.length === 0) {
        setError('No cases available for listing today.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadSuggestedSlots = async () => {
    try {
      const slots = await getSuggestedTimeSlots(courtNo, estimatedDuration);
      setSuggestedSlots(slots);
    } catch (err) {
      console.error('Error loading suggested slots:', err);
    }
  };

  useEffect(() => {
    const validateSlot = async () => {
      if (schedulingMode === 'manual' && manualStartTime && manualEndTime) {
        try {
          const result = await validateTimeSlot({
            court_no: courtNo,
            start_time: manualStartTime,
            end_time: manualEndTime
          });
          
          if (!result.available) {
            setTimeConflict(result.conflicts);
          } else {
            setTimeConflict(null);
          }
        } catch (err) {
          console.error('Error validating time slot:', err);
        }
      } else {
        setTimeConflict(null);
      }
    };

    const debounce = setTimeout(validateSlot, 500);
    return () => clearTimeout(debounce);
  }, [manualStartTime, manualEndTime, schedulingMode, courtNo]);

  const handleStartHearing = async (caseNum) => {
    try {
      await startHearing({
        schedule_id: schedule.schedule_id,
        case_num: caseNum
      });
      loadSchedule();
      showSuccess('Hearing started successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEndHearing = async (caseNum) => {
    try {
      await endHearing({
        schedule_id: schedule.schedule_id,
        case_num: caseNum
      });
      loadSchedule();
      showSuccess('Hearing ended successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDismissHearing = async (caseNum) => {
    try {
      await dismissHearing({
        schedule_id: schedule.schedule_id,
        case_num: caseNum,
        reason: 'Dismissed by court admin'
      });
      loadSchedule();
      showSuccess('Hearing dismissed');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReopenHearing = async (caseNum) => {
    if (!window.confirm('Are you sure you want to reopen this hearing?')) return;

    try {
      await reopenHearing({
        schedule_id: schedule.schedule_id,
        case_num: caseNum
      });
      loadSchedule();
      showSuccess('Hearing reopened successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveCase = async (caseNum) => {
    if (!window.confirm('Remove this case from today\'s schedule?')) return;

    try {
      await removeCaseFromSchedule({
        schedule_id: schedule.schedule_id,
        case_num: caseNum
      });
      loadSchedule();
      showSuccess('Case removed from schedule');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditTiming = (caseItem) => {
    setEditingCase(caseItem.case_num);
    
    const start = new Date(caseItem.listing_time_start);
    const end = new Date(caseItem.listing_time_end);
    
    setEditStartTime(formatDateTimeLocal(start));
    setEditEndTime(formatDateTimeLocal(end));
  };

  const handleSaveEditedTiming = async (caseNum) => {
    try {
      const startDate = new Date(editStartTime);
      const endDate = new Date(editEndTime);
      const now = new Date();

      if (startDate < now) {
        setError('Cannot schedule in the past');
        return;
      }

      if (endDate <= startDate) {
        setError('End time must be after start time');
        return;
      }

      await updateCaseTiming({
        schedule_id: schedule.schedule_id,
        case_num: caseNum,
        new_start_time: startDate.toISOString(),
        new_end_time: endDate.toISOString(),
        cascade_updates: cascadeUpdates
      });

      setEditingCase(null);
      loadSchedule();
      showSuccess('Timing updated successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddToSchedule = async () => {
    if (!selectedCase || !selectedHearing) {
      setError('Please select a case and hearing');
      return;
    }

    try {
      const payload = {
        case_num: selectedCase.case_num,
        hearing_id: selectedHearing._id,
        court_no: courtNo,
        estimated_duration: estimatedDuration,
        auto_schedule: schedulingMode === 'auto'
      };

      if (schedulingMode === 'manual') {
        if (!manualStartTime || !manualEndTime) {
          setError('Please select start and end times');
          return;
        }

        const startDate = new Date(manualStartTime);
        const endDate = new Date(manualEndTime);
        const now = new Date();

        if (startDate < now) {
          setError('Cannot schedule in the past');
          return;
        }

        if (endDate <= startDate) {
          setError('End time must be after start time');
          return;
        }

        payload.listing_time_start = startDate.toISOString();
        payload.listing_time_end = endDate.toISOString();
      }

      await createListing(payload);
      
      setShowScheduleForm(false);
      setSelectedCase(null);
      setSelectedHearing(null);
      setEstimatedDuration(60);
      setSchedulingMode('auto');
      setManualStartTime('');
      setManualEndTime('');
      setError(null);
      
      loadSchedule();
      showSuccess('Case added to schedule successfully');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const calculateElapsedTime = (startTime) => {
    const elapsed = Math.floor((currentTime - new Date(startTime)) / 1000 / 60);
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#fbbf24',
      in_progress: '#10b981',
      completed: '#6b7280',
      dismissed: '#ef4444',
      adjourned: '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  const currentCase = schedule?.scheduled_cases?.find(c => c.status === 'in_progress') 
    || schedule?.scheduled_cases?.[schedule.current_case_index];
    
  const upcomingCases = schedule?.scheduled_cases?.filter(c => 
    c.status === 'scheduled' && 
    (!currentCase || c.listing_order > currentCase.listing_order)
  ) || [];

  if (loading && !schedule) {
    return (
      <div className="cadash-loading-container">
        <Clock size={24} className="cadash-loading-icon" />
        <span>Loading court schedule...</span>
      </div>
    );
  }

  return (
    <div className="cadash-wrapper">
      <div className="cadash-header">
        <div className="cadash-header-info">
          <h1 className="cadash-title">Live Court Dashboard</h1>
          <div className="cadash-court-info">
            <div className="cadash-info-item">
              <span className="cadash-info-label">Court No:</span>
              <span className="cadash-info-value">{courtNo}</span>
            </div>
            <div className="cadash-info-item">
              <span className="cadash-info-label">Current Time:</span>
              <span className="cadash-info-value">{currentTime.toLocaleTimeString()}</span>
            </div>
            {schedule && (
              <div className="cadash-info-item">
                <span className="cadash-info-label">Cases Today:</span>
                <span className="cadash-info-value">{schedule.scheduled_cases?.length || 0}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="cadash-alert cadash-alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="cadash-alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="cadash-alert cadash-alert-success">
          <CheckCircle size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="cadash-alert-close">×</button>
        </div>
      )}

      <div className="cadash-add-section">
        <button
          onClick={() => {
            setShowScheduleForm(!showScheduleForm);
            if (!showScheduleForm) {
              loadAvailableCases();
              if (schedulingMode === 'manual') {
                loadSuggestedSlots();
              }
            }
          }}
          className="cadash-btn cadash-btn-add"
        >
          <Plus size={14} />
          {showScheduleForm ? 'Cancel' : 'Add Case to Schedule'}
        </button>
      </div>

      {showScheduleForm && (
        <div className="cadash-schedule-form">
          <h3 className="cadash-form-title">Schedule New Case</h3>
          
          {availableCases.length === 0 ? (
            <div className="cadash-empty-state">
              <p>No cases available for listing today.</p>
            </div>
          ) : (
            <>
              <div className="cadash-form-group">
                <label className="cadash-label">Select Case:</label>
                <select
                  value={selectedCase?.case_num || ''}
                  onChange={(e) => {
                    const c = availableCases.find(c => c.case_num === e.target.value);
                    setSelectedCase(c);
                    setSelectedHearing(null);
                  }}
                  className="cadash-select"
                >
                  <option value="">-- Select Case --</option>
                  {availableCases.map(c => (
                    <option key={c.case_num} value={c.case_num}>
                      {c.case_num} - {c.case_type} ({c.plaintiff_details?.name} vs {c.respondent_details?.name})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCase && (
                <div className="cadash-form-group">
                  <label className="cadash-label">Select Hearing:</label>
                  <select
                    value={selectedHearing?._id || ''}
                    onChange={(e) => {
                      const h = selectedCase.hearings.find(h => h._id === e.target.value);
                      setSelectedHearing(h);
                    }}
                    className="cadash-select"
                  >
                    <option value="">-- Select Hearing --</option>
                    {selectedCase.hearings
                      .filter(h => {
                        const hearingDate = new Date(h.next_hearing_date);
                        hearingDate.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return hearingDate.toISOString().split('T')[0] === today.toISOString().split('T')[0] 
                          && !h.is_listed_for_today;
                      })
                      .map(h => (
                        <option key={h._id} value={h._id}>
                          {h.hearing_type} - {new Date(h.next_hearing_date).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="cadash-form-group">
                <label className="cadash-label">Scheduling Mode:</label>
                <div className="cadash-mode-toggle">
                  <button
                    onClick={() => {
                      setSchedulingMode('auto');
                      setManualStartTime('');
                      setManualEndTime('');
                    }}
                    className={`cadash-mode-btn ${schedulingMode === 'auto' ? 'cadash-mode-active' : ''}`}
                  >
                    Auto Schedule
                  </button>
                  <button
                    onClick={() => {
                      setSchedulingMode('manual');
                      loadSuggestedSlots();
                    }}
                    className={`cadash-mode-btn ${schedulingMode === 'manual' ? 'cadash-mode-active' : ''}`}
                  >
                    Manual Time
                  </button>
                </div>
              </div>

              <div className="cadash-form-group">
                <label className="cadash-label">Estimated Duration (minutes):</label>
                <input
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => {
                    setEstimatedDuration(parseInt(e.target.value));
                    if (schedulingMode === 'manual') {
                      loadSuggestedSlots();
                    }
                  }}
                  min="15"
                  max="240"
                  step="15"
                  className="cadash-input"
                />
              </div>

              {schedulingMode === 'manual' && (
                <>
                  {suggestedSlots.length > 0 && (
                    <div className="cadash-form-group">
                      <label className="cadash-label">Suggested Time Slots:</label>
                      <div className="cadash-slot-list">
                        {suggestedSlots.map((slot, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setManualStartTime(formatDateTimeLocal(slot.start_time));
                              setManualEndTime(formatDateTimeLocal(slot.end_time));
                            }}
                            className="cadash-slot-btn"
                          >
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            {slot.gap_after_case && (
                              <span className="cadash-slot-hint">(after {slot.gap_after_case})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="cadash-form-group">
                    <label className="cadash-label">Start Time:</label>
                    <input
                      type="datetime-local"
                      value={manualStartTime}
                      onChange={(e) => setManualStartTime(e.target.value)}
                      min={formatDateTimeLocal(new Date())}
                      className="cadash-input"
                    />
                  </div>

                  <div className="cadash-form-group">
                    <label className="cadash-label">End Time:</label>
                    <input
                      type="datetime-local"
                      value={manualEndTime}
                      onChange={(e) => setManualEndTime(e.target.value)}
                      min={manualStartTime || formatDateTimeLocal(new Date())}
                      className="cadash-input"
                    />
                  </div>

                  {timeConflict && timeConflict.length > 0 && (
                    <div className="cadash-conflict-warning">
                      <strong>⚠️ Time Conflict!</strong>
                      <p>Conflicts with: {timeConflict.map(c => c.case_num).join(', ')}</p>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handleAddToSchedule}
                className="cadash-btn cadash-btn-submit"
                disabled={!selectedCase || !selectedHearing || (schedulingMode === 'manual' && timeConflict)}
              >
                Add to Schedule
              </button>
            </>
          )}
        </div>
      )}

      {currentCase ? (
        <div className="cadash-current-case">
          <div className={`cadash-status-badge cadash-status-${currentCase.status.toLowerCase().replace(' ', '-')}`}>
            <span className={`cadash-status-dot ${currentCase.status === 'in_progress' ? 'cadash-dot-green' : 'cadash-dot-yellow'}`}></span>
            {currentCase.status === 'in_progress' ? 'IN PROGRESS' : 'SCHEDULED'}
          </div>

          <div className="cadash-case-details">
            <div className="cadash-case-number">Case #{currentCase.case_num}</div>
            
            <div className="cadash-case-info">
              <div className="cadash-info-row">
                <span className="cadash-case-label">Case Type</span>
                <span className="cadash-case-value">{currentCase.case_type}</span>
              </div>
              
              <div className="cadash-info-row">
                <span className="cadash-case-label">Plaintiff</span>
                <span className="cadash-case-value">{currentCase.plaintiff_name}</span>
              </div>
              
              <div className="cadash-info-row">
                <span className="cadash-case-label">Respondent</span>
                <span className="cadash-case-value">{currentCase.respondent_name}</span>
              </div>
              
              <div className="cadash-info-row">
                <span className="cadash-case-label">Scheduled Time</span>
                <span className="cadash-time-display">
                  {formatTime(currentCase.listing_time_start)} - {formatTime(currentCase.listing_time_end)}
                  {currentCase.actual_start_time && (
                    <span className="cadash-elapsed-time">
                      ({calculateElapsedTime(currentCase.actual_start_time)})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="cadash-action-buttons">
            {currentCase.status === 'scheduled' && (
              <>
                <button onClick={() => handleStartHearing(currentCase.case_num)} className="cadash-btn cadash-btn-success">
                  <Play size={14} />
                  Start
                </button>
                <button onClick={() => handleEditTiming(currentCase)} className="cadash-btn cadash-btn-primary">
                  <Edit2 size={14} />
                  Edit
                </button>
                <button onClick={() => handleRemoveCase(currentCase.case_num)} className="cadash-btn cadash-btn-danger">
                  <Trash2 size={14} />
                  Remove
                </button>
              </>
            )}
            
            {currentCase.status === 'in_progress' && (
              <>
                <button onClick={() => handleEndHearing(currentCase.case_num)} className="cadash-btn cadash-btn-success">
                  <Square size={14} />
                  End
                </button>
                <button onClick={() => handleDismissHearing(currentCase.case_num)} className="cadash-btn cadash-btn-danger">
                  <XCircle size={14} />
                  Dismiss
                </button>
              </>
            )}

            {(currentCase.status === 'completed' || currentCase.status === 'dismissed') && (
              <button onClick={() => handleReopenHearing(currentCase.case_num)} className="cadash-btn cadash-btn-primary">
                <RotateCcw size={14} />
                Reopen
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="cadash-no-case">
          <div className="cadash-empty-icon">⚖️</div>
          <p>No active case in progress</p>
        </div>
      )}

      <div className="cadash-queue-section">
        <div className="cadash-queue-header">
          <Calendar size={18} />
          UPCOMING QUEUE
        </div>
        
        {upcomingCases.length === 0 ? (
          <div className="cadash-no-case">
            <p>No upcoming cases in queue</p>
          </div>
        ) : (
          <div className="cadash-queue-list">
            {upcomingCases.map((queueCase, index) => (
              <div key={queueCase.case_num} className="cadash-queue-item">
                <div className="cadash-queue-info">
                  <div className="cadash-queue-order">{index + 1}</div>
                  <div>
                    <div className="cadash-queue-case-num">{queueCase.case_num}</div>
                    <div className="cadash-queue-case-type">{queueCase.case_type}</div>
                  </div>
                </div>
                <div className="cadash-queue-actions">
                  {editingCase === queueCase.case_num ? (
                    <div className="cadash-edit-time-form">
                      <input
                        type="datetime-local"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        min={formatDateTimeLocal(new Date())}
                        className="cadash-time-input"
                      />
                      <input
                        type="datetime-local"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        min={editStartTime}
                        className="cadash-time-input"
                      />
                      <label className="cadash-checkbox-label">
                        <input
                          type="checkbox"
                          checked={cascadeUpdates}
                          onChange={(e) => setCascadeUpdates(e.target.checked)}
                        />
                        Adjust subsequent cases
                      </label>
                      <div className="cadash-edit-actions">
                        <button onClick={() => handleSaveEditedTiming(queueCase.case_num)} className="cadash-btn-sm cadash-btn-success">
                          Save
                        </button>
                        <button onClick={() => setEditingCase(null)} className="cadash-btn-sm cadash-btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="cadash-queue-time">
                        {formatTime(queueCase.listing_time_start)} - {formatTime(queueCase.listing_time_end)}
                      </div>
                      <div className="cadash-queue-btn-group">
                        <button onClick={() => handleEditTiming(queueCase)} className="cadash-btn-sm cadash-btn-primary">
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button onClick={() => handleRemoveCase(queueCase.case_num)} className="cadash-btn-sm cadash-btn-danger">
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {schedule && schedule.scheduled_cases && schedule.scheduled_cases.length > 0 && (
        <div className="cadash-all-cases">
          <div className="cadash-all-cases-header">
            All Cases Today ({schedule.scheduled_cases.length})
          </div>
          <div className="cadash-table-wrapper">
            <table className="cadash-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Case No</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedule.scheduled_cases.map((caseItem, idx) => (
                  <tr key={caseItem.case_num}>
                    <td>{idx + 1}</td>
                    <td className="cadash-table-case-num">{caseItem.case_num}</td>
                    <td>{caseItem.case_type}</td>
                    <td className="cadash-table-time">
                      {formatTime(caseItem.listing_time_start)} - {formatTime(caseItem.listing_time_end)}
                    </td>
                    <td>
                      <span className={`cadash-table-status cadash-status-${caseItem.status}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td>
                      <div className="cadash-table-actions">
                        {caseItem.status === 'scheduled' && (
                          <>
                            <button onClick={() => handleStartHearing(caseItem.case_num)} className="cadash-btn-xs cadash-btn-success">
                              Start
                            </button>
                            <button onClick={() => handleEditTiming(caseItem)} className="cadash-btn-xs cadash-btn-primary">
                              Edit
                            </button>
                          </>
                        )}
                        {caseItem.status === 'in_progress' && (
                          <button onClick={() => handleEndHearing(caseItem.case_num)} className="cadash-btn-xs cadash-btn-secondary">
                            End
                          </button>
                        )}
                        {(caseItem.status === 'completed' || caseItem.status === 'dismissed') && (
                          <button onClick={() => handleReopenHearing(caseItem.case_num)} className="cadash-btn-xs cadash-btn-warning">
                            Reopen
                          </button>
                        )}
                        <button onClick={() => handleRemoveCase(caseItem.case_num)} className="cadash-btn-xs cadash-btn-danger">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtAdminLiveDashboard;