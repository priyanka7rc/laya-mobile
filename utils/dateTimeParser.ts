/**
 * Date and time parsing utilities for task creation
 */

/**
 * Parse relative date strings like "today", "tomorrow", "Monday", etc.
 * Returns YYYY-MM-DD format
 */
export function parseDate(text: string): string | null {
  const lowerText = text.toLowerCase();
  const today = new Date();
  
  // Today
  if (lowerText.includes('today')) {
    return formatDate(today);
  }
  
  // Tomorrow
  if (lowerText.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }
  
  // Day names (next occurrence)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (lowerText.includes(dayNames[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let daysToAdd = targetDay - currentDay;
      
      // If the day has passed this week, go to next week
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
      
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      return formatDate(targetDate);
    }
  }
  
  // Next week
  if (lowerText.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return formatDate(nextWeek);
  }
  
  // This weekend (Saturday)
  if (lowerText.includes('weekend') || lowerText.includes('saturday') || lowerText.includes('sunday')) {
    const currentDay = today.getDay();
    const daysToSaturday = currentDay === 0 ? 6 : 6 - currentDay;
    const saturday = new Date(today);
    saturday.setDate(saturday.getDate() + daysToSaturday);
    return formatDate(saturday);
  }
  
  // Default to today if no date found
  return formatDate(today);
}

/**
 * Get smart default time based on keywords or context
 */
function getSmartDefaultTime(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // Meal-specific times
  if (lowerText.includes('breakfast')) return '08:00';
  if (lowerText.includes('brunch')) return '11:00';
  if (lowerText.includes('lunch')) return '12:00';
  if (lowerText.includes('snack')) return '15:00';
  if (lowerText.includes('dinner')) return '18:30';
  if (lowerText.includes('supper')) return '19:00';
  if (lowerText.includes('dessert')) return '20:00';
  
  // Time-of-day keywords
  if (lowerText.includes('morning')) {
    // Gym/workout in morning = early
    if (lowerText.includes('gym') || lowerText.includes('workout') || lowerText.includes('exercise')) {
      return '07:00';
    }
    return '08:00';
  }
  if (lowerText.includes('noon')) return '12:00';
  if (lowerText.includes('afternoon')) return '14:00';
  if (lowerText.includes('evening')) return '18:00';
  if (lowerText.includes('night') || lowerText.includes('tonight')) return '20:00';
  if (lowerText.includes('midnight')) return '00:00';
  
  // Health appointments (business hours) - only for explicit health keywords
  if (lowerText.includes('doctor') || lowerText.includes('dentist') || 
      lowerText.includes('checkup') || lowerText.includes('physical') ||
      lowerText.includes('therapy')) {
    return '10:00';
  }
  
  return null; // No smart default found
}

/**
 * Parse time strings like "at 5pm", "8:00", "9am", etc.
 * Returns HH:MM format (24-hour)
 */
export function parseTime(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  console.log('🕐 Parsing time from:', text);
  
  // Match patterns - ORDERED by specificity (most specific first)
  const timePatterns = [
    // With colon (hours:minutes + optional am/pm)
    { regex: /at\s*(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)/i, hasColon: true },  // at 5:30pm, at 3:00 p.m.
    { regex: /(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)/i, hasColon: true },       // 5:30pm, 3:00 p.m.
    { regex: /(\d{1,2}):(\d{2})(?!\s*[ap]\.?m)/i, hasColon: true },        // 17:00, 05:30 (24-hour, no am/pm)
    
    // Without colon (hours only + required am/pm)
    { regex: /at\s*(\d{1,2})\s*([ap]\.?m\.?)/i, hasColon: false },         // at 5pm, at 3 p.m.
    { regex: /(\d{1,2})\s*([ap]\.?m\.?)/i, hasColon: false },              // 5pm, 3 p.m., 6 p.m
  ];
  
  for (let i = 0; i < timePatterns.length; i++) {
    const { regex, hasColon } = timePatterns[i];
    const match = lowerText.match(regex);
    
    if (match) {
      console.log(`✓ Matched pattern ${i}:`, match[0]);
      
      let hours: number;
      let minutes: number;
      let meridiem: string | undefined;
      
      if (hasColon) {
        // Pattern: hours:minutes [am/pm]
        hours = parseInt(match[1]);
        minutes = parseInt(match[2]);
        meridiem = match[3]; // May be undefined for 24-hour format
      } else {
        // Pattern: hours am/pm (no colon)
        hours = parseInt(match[1]);
        minutes = 0;
        meridiem = match[2]; // am/pm is in second capture group
      }
      
      console.log(`  Hours: ${hours}, Minutes: ${minutes}, Meridiem: ${meridiem}`);
      
      // Convert to 24-hour format if meridiem is present
      if (meridiem) {
        // Remove periods from meridiem (p.m. -> pm)
        const meridiemClean = meridiem.toLowerCase().replace(/\./g, '');
        if (meridiemClean === 'pm' && hours < 12) {
          hours += 12;
        } else if (meridiemClean === 'am' && hours === 12) {
          hours = 0;
        }
      }
      
      console.log(`  Converted to 24-hour: ${hours}:${minutes}`);
      
      // Validate hours and minutes
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        console.log(`✅ Parsed time: ${result}`);
        return result;
      }
    }
  }
  
  // Try smart default time based on keywords
  const smartDefault = getSmartDefaultTime(text);
  if (smartDefault) {
    console.log(`✅ Using smart default time: ${smartDefault}`);
    return smartDefault;
  }
  
  console.log('⚠️ No time found, defaulting to 20:00');
  // Default to 8 PM (20:00)
  return '20:00';
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return formatDate(new Date());
}

/**
 * Format date for display (e.g., "Today, Nov 21", "Tomorrow, Nov 22", "Mon, Nov 25")
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Reset time for comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  // Get the formatted date part (e.g., "Nov 21")
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  if (date.getTime() === today.getTime()) {
    return `Today, ${dateStr}`;
  } else if (date.getTime() === tomorrow.getTime()) {
    return `Tomorrow, ${dateStr}`;
  } else {
    // For other days, show weekday and date
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

/**
 * Format time for display (e.g., "8:00 PM")
 */
export function formatTimeForDisplay(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

