import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ComponentsCSS/admincalendar.css';

const AdminCalendarPanel = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [calendarEntries, setCalendarEntries] = useState({});
  const [formData, setFormData] = useState({
    is_holiday: false,
    holiday_reason: '',
    opening_time: '09:00',
    closing_time: '17:00'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  // Load holidays and calendar entries for current month
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
        // Get calendar entries for the month
        const response = await axios.get(`https://ecourt-yr51.onrender.com/api/calendar/${year}/${month}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Get holidays
        const holidaysResponse = await axios.get('https://ecourt-yr51.onrender.com/api/admin/calendar/holidays', {
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
        setHolidays(holidaysResponse.data.holidays);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load calendar data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentMonth]);

  // Load entry for selected date
  useEffect(() => {
    const dateKey = formatDate(selectedDate);
    if (calendarEntries[dateKey]) {
      const entry = calendarEntries[dateKey];
      setFormData({
        is_holiday: entry.is_holiday,
        holiday_reason: entry.holiday_reason || '',
        opening_time: entry.opening_time || '09:00',
        closing_time: entry.closing_time || '17:00'
      });
    } else {
      // Reset form for dates without entries
      setFormData({
        is_holiday: false,
        holiday_reason: '',
        opening_time: '09:00',
        closing_time: '17:00'
      });
    }
  }, [selectedDate, calendarEntries]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      setLoading(true);
      const dateKey = formatDate(selectedDate);
      const entry = calendarEntries[dateKey];
      
      const data = {
        date: dateKey,
        is_holiday: formData.is_holiday,
        holiday_reason: formData.holiday_reason,
        opening_time: formData.opening_time,
        closing_time: formData.closing_time
      };
      
      let response;
      
      if (entry) {
        // Update existing entry
        response = await axios.put(`https://ecourt-yr51.onrender.com/api/calendar/${entry.calendar_id}`, data, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        // Create new entry
        response = await axios.post('https://ecourt-yr51.onrender.com/api/calendar', data, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      // Update local state
      const updatedEntries = { ...calendarEntries };
      updatedEntries[dateKey] = response.data.calendar;
      setCalendarEntries(updatedEntries);
      
      // If holiday status changed, refresh holidays list
      if (formData.is_holiday) {
        const holidaysResponse = await axios.get('https://ecourt-yr51.onrender.com/api/admin/calendar/holidays', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setHolidays(holidaysResponse.data.holidays);
      }
      
      setSuccess('Calendar entry saved successfully');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save calendar entry');
      setLoading(false);
    }
  };

  // Generate calendar days
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.
    
    // Create array for calendar days
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(<td key={`empty-${i}`} className="court-calendar__empty-cell"></td>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDate(date);
      const entry = calendarEntries[dateKey];
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isHoliday = entry && entry.is_holiday;
      
      let className = "court-calendar__day-cell";
      if (isSelected) className += " court-calendar__day-cell--selected";
      if (isHoliday) className += " court-calendar__day-cell--holiday";
      
      calendarDays.push(
        <td 
          key={day} 
          className={className}
          onClick={() => setSelectedDate(new Date(year, month, day))}
        >
          <div className="court-calendar__day-number">{day}</div>
          {entry && (
            <div className="court-calendar__day-content">
              {isHoliday && <div className="court-calendar__holiday-badge">Holiday</div>}
              {!isHoliday && (
                <div className="court-calendar__timing-info">
                  {entry.opening_time} - {entry.closing_time}
                </div>
              )}
            </div>
          )}
        </td>
      );
    }
    
    // Group days into weeks
    const weeks = [];
    let days = [];
    
    calendarDays.forEach((day, index) => {
      days.push(day);
      
      if ((index + 1) % 7 === 0 || index === calendarDays.length - 1) {
        // Fill in remaining days of the week if needed
        while (days.length < 7) {
          days.push(<td key={`empty-end-${days.length}`} className="court-calendar__empty-cell"></td>);
        }
        
        weeks.push(<tr key={`week-${weeks.length}`}>{days}</tr>);
        days = [];
      }
    });
    
    return weeks;
  };

  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();

  return (
    <div className="court-admin-panel">
      <h2 className="court-admin-panel__title">Court Calendar Management</h2>
      
      <div className="court-admin-panel__container">
        <div className="court-calendar__wrapper">
          <div className="court-calendar__header">
            <button className="court-calendar__nav-btn court-calendar__nav-btn--prev" onClick={prevMonth}>&lt;</button>
            <h3 className="court-calendar__month-title">{monthName} {year}</h3>
            <button className="court-calendar__nav-btn court-calendar__nav-btn--next" onClick={nextMonth}>&gt;</button>
          </div>
          <table className="court-calendar__table">
            <thead className="court-calendar__thead">
              <tr>
                <th className="court-calendar__weekday">Sun</th>
                <th className="court-calendar__weekday">Mon</th>
                <th className="court-calendar__weekday">Tue</th>
                <th className="court-calendar__weekday">Wed</th>
                <th className="court-calendar__weekday">Thu</th>
                <th className="court-calendar__weekday">Fri</th>
                <th className="court-calendar__weekday">Sat</th>
              </tr>
            </thead>
            <tbody className="court-calendar__tbody">
              {generateCalendar()}
            </tbody>
          </table>
        </div>
        
        <div className="court-calendar__form-container">
          <h3 className="court-calendar__form-title">Edit Court Timing for {formatDate(selectedDate)}</h3>
          
          {error && <div className="court-calendar__error-message">{error}</div>}
          {success && <div className="court-calendar__success-message">{success}</div>}
          
          <form className="court-calendar__form" onSubmit={handleSubmit}>
            <div className="court-calendar__form-group">
              <label className="court-calendar__checkbox-label">
                <input
                  type="checkbox"
                  className="court-calendar__checkbox"
                  name="is_holiday"
                  checked={formData.is_holiday}
                  onChange={handleChange}
                />
                <span className="court-calendar__checkbox-text">Mark as Holiday</span>
              </label>
            </div>
            
            {formData.is_holiday && (
              <div className="court-calendar__form-group">
                <label className="court-calendar__label">Holiday Reason:</label>
                <input
                  type="text"
                  className="court-calendar__input"
                  name="holiday_reason"
                  value={formData.holiday_reason}
                  onChange={handleChange}
                  placeholder="Enter reason for holiday"
                />
              </div>
            )}
            
            <div className="court-calendar__form-group">
              <label className="court-calendar__label">Opening Time:</label>
              <input
                type="time"
                className="court-calendar__input court-calendar__input--time"
                name="opening_time"
                value={formData.opening_time}
                onChange={handleChange}
                disabled={formData.is_holiday}
              />
            </div>
            
            <div className="court-calendar__form-group">
              <label className="court-calendar__label">Closing Time:</label>
              <input
                type="time"
                className="court-calendar__input court-calendar__input--time"
                name="closing_time"
                value={formData.closing_time}
                onChange={handleChange}
                disabled={formData.is_holiday}
              />
            </div>
            
            <button 
              type="submit" 
              className={`court-calendar__submit-btn ${loading ? 'court-calendar__submit-btn--loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Calendar Entry'}
            </button>
          </form>
        </div>
      </div>
      
      <div className="court-calendar__holidays-section">
        <h3 className="court-calendar__holidays-title">Upcoming Holidays</h3>
        {holidays.length === 0 ? (
          <p className="court-calendar__no-holidays">No upcoming holidays found.</p>
        ) : (
          <ul className="court-calendar__holidays-list">
            {holidays.map((holiday) => (
              <li key={holiday.calendar_id} className="court-calendar__holiday-item">
                <span className="court-calendar__holiday-date">{new Date(holiday.date).toLocaleDateString()}</span>
                {holiday.holiday_reason && <span className="court-calendar__holiday-reason">{holiday.holiday_reason}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminCalendarPanel;