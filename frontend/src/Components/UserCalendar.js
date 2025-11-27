import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import '../ComponentsCSS/calendar.css'; // You'll need to create this CSS file

const UserCalendarPanel = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayTiming, setTodayTiming] = useState(null);
  const [calendarEntries, setCalendarEntries] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  // Load today's timing
  useEffect(() => {
    const fetchTodayTiming = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://ecourt-yr51.onrender.com/api/calendar/today', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setTodayTiming(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load today\'s timing');
        setLoading(false);
      }
    };
    
    fetchTodayTiming();
  }, []);

  // Load calendar entries for current month
  useEffect(() => {
    const fetchCalendarEntries = async () => {
      try {
        setLoading(true);
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        
        const response = await axios.get(`https://ecourt-yr51.onrender.com/api/calendar/${year}/${month}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Transform calendar entries into an object for easy lookup
        const entriesObj = {};
        response.data.calendar.forEach(entry => {
          const dateKey = formatDate(entry.date);
          entriesObj[dateKey] = entry;
        });
        
        setCalendarEntries(entriesObj);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load calendar data');
        setLoading(false);
      }
    };
    
    fetchCalendarEntries();
  }, [selectedDate]);

  // Custom calendar component since react-calendar is causing issues
  const CustomCalendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // Get all dates in the current month view
    const getDaysInMonth = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Get first day of month and last day
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Get day of week of first day (0 = Sunday, 6 = Saturday)
      const firstDayOfWeek = firstDay.getDay();
      
      const daysArray = [];
      
      // Add empty cells for days before the 1st of the month
      for (let i = 0; i < firstDayOfWeek; i++) {
        daysArray.push(null);
      }
      
      // Add all days in the month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        daysArray.push(new Date(year, month, i));
      }
      
      return daysArray;
    };
    
    const goToPreviousMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    
    const goToNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };
    
    // Format month name
    const formatMonthYear = () => {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    };
    
    const isToday = (date) => {
      const today = new Date();
      return date && 
             date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    };
    
    const isSelected = (date) => {
      return date && 
             date.getDate() === selectedDate.getDate() &&
             date.getMonth() === selectedDate.getMonth() &&
             date.getFullYear() === selectedDate.getFullYear();
    };
    
    const days = getDaysInMonth();
    
    useEffect(() => {
      // Update the current month when selected date changes to a different month
      if (selectedDate.getMonth() !== currentMonth.getMonth() || 
          selectedDate.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      }
    }, [selectedDate, currentMonth]);
    
    return (
      <div className="custom-calendar">
        <div className="calendar-header">
          <button onClick={goToPreviousMonth}>&lt;</button>
          <div className="month-year">{formatMonthYear()}</div>
          <button onClick={goToNextMonth}>&gt;</button>
        </div>
        
        <div className="calendar-weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div className="calendar-days">
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="calendar-day empty"></div>;
            }
            
            const dateKey = formatDate(day);
            const entry = calendarEntries[dateKey];
            const classes = [
              'calendar-day',
              isToday(day) ? 'today' : '',
              isSelected(day) ? 'selected' : '',
              entry && entry.is_holiday ? 'holiday-date' : ''
            ].filter(Boolean).join(' ');
            
            return (
              <div 
                key={dateKey} 
                className={classes}
                onClick={() => setSelectedDate(day)}
              >
                <div className="day-number">{day.getDate()}</div>
                {entry && (
                  <div className="calendar-tile-content">
                    {entry.is_holiday && <div className="holiday-marker">Holiday</div>}
                    {!entry.is_holiday && (
                      <div className="timing-info">
                        {entry.opening_time.slice(0, 5)} - {entry.closing_time.slice(0, 5)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Get selected date info
  const getSelectedDateInfo = () => {
    const dateKey = formatDate(selectedDate);
    return calendarEntries[dateKey];
  };

  const selectedDateInfo = getSelectedDateInfo();

  return (
    <div className="user-calendar-panel">
      <h2>Court Calendar</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading calendar data...</div>
      ) : (
        <>
          <div className="today-timing-card">
            <h3>Today's Court Timing</h3>
            {todayTiming ? (
              <div className="timing-info">
                {todayTiming.is_holiday ? (
                  <div className="holiday-info">
                    <p className="holiday-label">Holiday Today</p>
                    {todayTiming.holiday_reason && (
                      <p className="holiday-reason">{todayTiming.holiday_reason}</p>
                    )}
                  </div>
                ) : (
                  <div className="court-hours">
                    <p>Open from <span className="time">{todayTiming.opening_time}</span> to <span className="time">{todayTiming.closing_time}</span></p>
                    <p>District: {todayTiming.district}</p>
                  </div>
                )}
              </div>
            ) : (
              <p>No timing information available for today.</p>
            )}
          </div>
          
          <div className="calendar-container">
            <div className="calendar-wrapper">
              <CustomCalendar />
            </div>
            
            <div className="selected-date-info">
              <h3>Selected Date: {formatDate(selectedDate)}</h3>
              
              {selectedDateInfo ? (
                <div className="date-details">
                  {selectedDateInfo.is_holiday ? (
                    <div className="holiday-info">
                      <p className="holiday-label">Holiday</p>
                      {selectedDateInfo.holiday_reason && (
                        <p className="holiday-reason">{selectedDateInfo.holiday_reason}</p>
                      )}
                    </div>
                  ) : (
                    <div className="court-hours">
                      <p>Court Hours: <span className="time">{selectedDateInfo.opening_time}</span> to <span className="time">{selectedDateInfo.closing_time}</span></p>
                    </div>
                  )}
                </div>
              ) : (
                <p>No information available for this date.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserCalendarPanel;