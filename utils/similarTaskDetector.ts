import { Task } from '../types/task';

interface Suggestion {
  type: 'combine';
  message: string;
  proposedTime: string;
  affectedTasks: string[];
}

/**
 * Find tasks in the same category and date
 */
export function findSimilarTasks(
  newTask: Task,
  existingTasks: Task[]
): Task[] {
  if (!newTask.due_date || !newTask.category) {
    return [];
  }

  return existingTasks.filter(task => {
    // Skip if it's the same task
    if (task.id === newTask.id) return false;
    
    // Must be same category
    if (task.category !== newTask.category) return false;
    
    // Must be same date
    if (task.due_date !== newTask.due_date) return false;
    
    // Both must have times
    if (!task.due_time || !newTask.due_time) return false;
    
    return true;
  });
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Format time for display (e.g., "3:00 PM")
 */
function formatTimeForDisplay(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Check if two times are close (within 2 hours)
 */
function areTimesClose(time1: string, time2: string): boolean {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  const diff = Math.abs(minutes1 - minutes2);
  return diff <= 120; // 2 hours = 120 minutes
}

/**
 * Calculate midpoint time between two times
 */
function calculateMidpointTime(time1: string, time2: string): string {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  const midpoint = Math.floor((minutes1 + minutes2) / 2);
  return minutesToTime(midpoint);
}

/**
 * Suggest time consolidation for similar tasks
 */
export function suggestTimeConsolidation(
  newTask: Task,
  similarTasks: Task[]
): Suggestion | null {
  if (similarTasks.length === 0 || !newTask.due_time) {
    return null;
  }

  // Find tasks with close times
  const closeTasks = similarTasks.filter(task =>
    task.due_time && areTimesClose(newTask.due_time!, task.due_time)
  );

  if (closeTasks.length === 0) {
    return null;
  }

  // Take the first close task
  const closeTask = closeTasks[0];
  const midpointTime = calculateMidpointTime(newTask.due_time, closeTask.due_time!);

  return {
    type: 'combine',
    message: `💡 You have "${closeTask.title}" at ${formatTimeForDisplay(closeTask.due_time!)}. Want to combine ${newTask.category} tasks at ${formatTimeForDisplay(midpointTime)}?`,
    proposedTime: midpointTime,
    affectedTasks: [newTask.id, closeTask.id],
  };
}

/**
 * Main function to check for similar tasks and suggest consolidation
 */
export function checkForSimilarTasks(
  newTask: Task,
  existingTasks: Task[]
): string | null {
  const similarTasks = findSimilarTasks(newTask, existingTasks);
  
  if (similarTasks.length === 0) {
    return null;
  }

  const suggestion = suggestTimeConsolidation(newTask, similarTasks);
  
  if (suggestion) {
    return suggestion.message;
  }

  // If tasks are similar but not close in time, just notify
  if (similarTasks.length >= 2) {
    return `💡 You have ${similarTasks.length} other ${newTask.category} tasks today. Consider batching them together!`;
  } else if (similarTasks.length === 1) {
    return `💡 You have another ${newTask.category} task today: "${similarTasks[0].title}"`;
  }

  return null;
}

