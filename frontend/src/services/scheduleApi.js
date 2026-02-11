// ============================================================
// UPDATED scheduleApi.js - Frontend API Service
// ============================================================
// Add these new functions to your existing scheduleApi.js

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// ============================================================
// EXISTING FUNCTIONS (keep as is)
// ============================================================

export const getTodaySchedule = async (court_no) => {
  const response = await axios.get(
    `${API_URL}/courtadmin/schedule/today/${court_no}`,
    getAuthHeader()
  );
  return response.data;
};

export const startHearing = async (data) => {
  const response = await axios.post(
    `${API_URL}/courtadmin/schedule/start-hearing`,
    data,
    getAuthHeader()
  );
  return response.data;
};

export const endHearing = async (data) => {
  const response = await axios.post(
    `${API_URL}/courtadmin/schedule/end-hearing`,
    data,
    getAuthHeader()
  );
  return response.data;
};

export const dismissHearing = async (data) => {
  const response = await axios.post(
    `${API_URL}/courtadmin/schedule/dismiss-hearing`,
    data,
    getAuthHeader()
  );
  return response.data;
};

export const getPublicSchedule = async (court_no) => {
  const response = await axios.get(`${API_URL}/schedule/public/${court_no}`);
  return response.data;
};

export const getCasesForListing = async () => {
  const response = await axios.get(
    `${API_URL}/cases/courtadmin`,
    getAuthHeader()
  );
  return response.data;
};

export const getUserCases = async () => {
  const response = await axios.get(
    `${API_URL}/cases/user-specific`,
    getAuthHeader()
  );
  return response.data;
};

// ============================================================
// UPDATED createListing function with time picker support
// ============================================================

export const createListing = async (data) => {
  // Validate required fields
  const {
    case_num,
    hearing_id,
    court_no,
    estimated_duration = 60,
    listing_time_start = null,
    listing_time_end = null,
    auto_schedule = true
  } = data;

  // If manual scheduling, validate times
  if (!auto_schedule) {
    if (!listing_time_start || !listing_time_end) {
      throw new Error('Manual scheduling requires both start and end times');
    }

    const start = new Date(listing_time_start);
    const end = new Date(listing_time_end);
    const now = new Date();

    if (start < now) {
      throw new Error('Cannot schedule hearing in the past');
    }

    if (end <= start) {
      throw new Error('End time must be after start time');
    }
  }

  const response = await axios.post(
    `${API_URL}/courtadmin/schedule/create-listing`,
    {
      case_num,
      hearing_id,
      court_no,
      estimated_duration,
      listing_time_start,
      listing_time_end,
      auto_schedule
    },
    getAuthHeader()
  );
  
  return response.data;
};

// ============================================================
// NEW FUNCTIONS
// ============================================================

/**
 * Update case timing manually
 */
export const updateCaseTiming = async (data) => {
  const {
    schedule_id,
    case_num,
    new_start_time,
    new_end_time,
    cascade_updates = true
  } = data;

  // Validate times
  const start = new Date(new_start_time);
  const end = new Date(new_end_time);
  const now = new Date();

  if (start < now) {
    throw new Error('Cannot schedule in the past');
  }

  if (end <= start) {
    throw new Error('End time must be after start time');
  }

  const response = await axios.post(
    `${API_URL}/courtadmin/schedule/update-timing`,
    {
      schedule_id,
      case_num,
      new_start_time,
      new_end_time,
      cascade_updates
    },
    getAuthHeader()
  );
  
  return response.data;
};

/**
 * Reopen a completed or dismissed hearing
 */
export const reopenHearing = async (data) => {
  const { schedule_id, case_num } = data;

  const response = await axios.post(
    `${API_URL}/courtadmin/schedule/reopen-hearing`,
    { schedule_id, case_num },
    getAuthHeader()
  );
  
  return response.data;
};

/**
 * Remove a case from the schedule
 */
export const removeCaseFromSchedule = async (data) => {
  const { schedule_id, case_num } = data;

  const response = await axios.post(
    `${API_URL}/courtadmin/schedule/remove-case`,
    { schedule_id, case_num },
    getAuthHeader()
  );
  
  return response.data;
};

/**
 * Validate if a time slot is available
 */
export const validateTimeSlot = async (data) => {
  const {
    court_no,
    start_time,
    end_time,
    exclude_case_num = null
  } = data;

  try {
    const schedule = await getTodaySchedule(court_no);
    
    if (!schedule || !schedule.scheduled_cases) {
      return { available: true, conflicts: [] };
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    const conflicts = schedule.scheduled_cases.filter(c => {
      if (exclude_case_num && c.case_num === exclude_case_num) {
        return false;
      }

      const caseStart = new Date(c.listing_time_start);
      const caseEnd = new Date(c.listing_time_end);

      return (
        (start >= caseStart && start < caseEnd) ||
        (end > caseStart && end <= caseEnd) ||
        (start <= caseStart && end >= caseEnd)
      );
    });

    return {
      available: conflicts.length === 0,
      conflicts: conflicts.map(c => ({
        case_num: c.case_num,
        start_time: c.listing_time_start,
        end_time: c.listing_time_end
      }))
    };
  } catch (error) {
    console.error('Error validating time slot:', error);
    throw error;
  }
};

/**
 * Get suggested time slots
 */
export const getSuggestedTimeSlots = async (court_no, duration_minutes = 60) => {
  try {
    const schedule = await getTodaySchedule(court_no);
    const suggestions = [];
    
    const now = new Date();
    const today = new Date(now);
    today.setHours(10, 0, 0, 0); // Court starts at 10 AM
    
    const endOfDay = new Date(today);
    endOfDay.setHours(17, 0, 0, 0); // Court ends at 5 PM

    let currentTime = new Date(Math.max(now.getTime(), today.getTime()));

    if (!schedule || !schedule.scheduled_cases || schedule.scheduled_cases.length === 0) {
      // No cases scheduled, suggest from court start time
      while (currentTime < endOfDay) {
        const slotEnd = new Date(currentTime.getTime() + (duration_minutes * 60000));
        if (slotEnd <= endOfDay) {
          suggestions.push({
            start_time: new Date(currentTime),
            end_time: slotEnd
          });
        }
        currentTime = new Date(currentTime.getTime() + (30 * 60000)); // 30 min increments
        
        if (suggestions.length >= 5) break;
      }
    } else {
      // Find gaps between scheduled cases
      const sortedCases = [...schedule.scheduled_cases].sort((a, b) => 
        new Date(a.listing_time_start) - new Date(b.listing_time_start)
      );

      for (let i = 0; i < sortedCases.length; i++) {
        const caseEnd = new Date(sortedCases[i].listing_time_end);
        const nextCaseStart = i < sortedCases.length - 1 
          ? new Date(sortedCases[i + 1].listing_time_start)
          : endOfDay;

        const gapDuration = (nextCaseStart - caseEnd) / 60000; // in minutes

        if (gapDuration >= duration_minutes) {
          const slotStart = new Date(Math.max(caseEnd.getTime(), currentTime.getTime()));
          const slotEnd = new Date(slotStart.getTime() + (duration_minutes * 60000));

          if (slotEnd <= nextCaseStart && slotStart >= now) {
            suggestions.push({
              start_time: slotStart,
              end_time: slotEnd,
              gap_after_case: sortedCases[i].case_num
            });
          }
        }
      }

      // Also check after last case
      const lastCase = sortedCases[sortedCases.length - 1];
      const afterLastCase = new Date(lastCase.listing_time_end);
      const slotEnd = new Date(afterLastCase.getTime() + (duration_minutes * 60000));
      
      if (slotEnd <= endOfDay && afterLastCase >= now) {
        suggestions.push({
          start_time: afterLastCase,
          end_time: slotEnd,
          gap_after_case: lastCase.case_num
        });
      }
    }

    return suggestions.slice(0, 5); // Return max 5 suggestions
  } catch (error) {
    console.error('Error getting suggested slots:', error);
    throw error;
  }
};