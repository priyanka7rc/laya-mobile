import { ParsedTaskInfo } from '../types/task';
import { parseDate, parseTime, getTodayDate, formatDateForDisplay, formatTimeForDisplay } from './dateTimeParser';
import { detectCategory } from './categoryDetector';

/**
 * Expand common voice recognition abbreviations
 */
function expandAbbreviations(text: string): string {
  return text
    .replace(/\bDr\.?\s/gi, 'Doctor ')
    .replace(/\bAppt\.?\s/gi, 'Appointment ')
    .replace(/\bMtg\.?\s/gi, 'Meeting ')
    .replace(/\bPres\.?\s/gi, 'Presentation ')
    .replace(/\bConf\.?\s/gi, 'Conference ')
    .replace(/\bProf\.?\s/gi, 'Professor ')
    .replace(/\bMr\.?\s/gi, 'Mister ')
    .replace(/\bMrs\.?\s/gi, 'Missus ')
    .replace(/\bMs\.?\s/gi, 'Miss ');
}

/**
 * Task-related command keywords
 */
const TASK_KEYWORDS = [
  'remind', 'reminder', 'todo', 'to do', 'task',
  'need to', 'have to', 'must', 'should',
  'don\'t forget', 'remember to', 'make sure'
];

/**
 * Action verbs that typically indicate a task (150+)
 */
const ACTION_VERBS = [
  // Shopping & Errands
  'buy', 'purchase', 'get', 'pick up', 'grab', 'fetch', 'order', 'shop', 'return', 'exchange', 'drop off',
  
  // Communication
  'call', 'text', 'message', 'email', 'contact', 'reach out', 'phone', 'notify', 'inform', 'tell', 
  'ask', 'reply', 'respond', 'follow up',
  
  // Food & Cooking
  'cook', 'make', 'prepare', 'bake', 'grill', 'fry', 'roast', 'eat', 'meal prep', 'defrost', 'marinate',
  
  // Cleaning & Home
  'clean', 'wash', 'vacuum', 'mop', 'sweep', 'scrub', 'organize', 'tidy', 'declutter', 'dust', 'wipe',
  'fix', 'repair', 'maintain', 'replace', 'install', 'do',
  
  // Work & Professional - Actions
  'schedule', 'book', 'reserve', 'arrange', 'plan', 'set up', 'coordinate',
  
  // Work - Completion
  'finish', 'complete', 'submit', 'send', 'deliver', 'ship', 'mail',
  
  // Work - Creation
  'write', 'draft', 'create', 'design', 'develop', 'build',
  
  // Work - Review
  'review', 'check', 'verify', 'confirm', 'validate', 'approve', 'proofread',
  
  // Work - Update
  'update', 'revise', 'edit', 'modify', 'change', 'amend',
  
  // Work - Preparation
  'compile', 'gather', 'collect', 'assemble',
  
  // Work - Participation
  'attend', 'join', 'participate', 'go to', 'show up',
  
  // Meetings & Events
  'meet', 'discuss', 'talk', 'present', 'pitch', 'conference call', 'interview',
  
  // Health & Fitness
  'workout', 'exercise', 'run', 'jog', 'walk', 'swim', 'bike', 'yoga', 'gym', 'train', 'practice', 
  'stretch', 'visit', 'see',
  
  // Learning & Personal
  'study', 'learn', 'read', 'research', 'memorize', 'watch', 'listen',
  
  // Social
  'meet up', 'hang out', 'catch up', 'celebrate', 'party', 'invite', 'host', 'rsvp',
  
  // Finance
  'pay', 'transfer', 'deposit', 'withdraw', 'budget', 'save', 'invest', 'file',
  
  // Time Management
  'reschedule', 'postpone', 'move', 'shift', 'cancel',
  
  // Miscellaneous
  'pack', 'unpack', 'upload', 'download', 'backup', 'charge', 'refill', 'renew', 'register', 
  'sign up', 'enroll', 'take', 'bring'
];

/**
 * Task-related nouns (category-specific that imply tasks)
 */
const TASK_NOUNS = [
  // Meals
  'breakfast', 'brunch', 'lunch', 'snack', 'dinner', 'supper', 'dessert',
  
  // Shopping
  'groceries', 'shopping', 'errands', 'supplies',
  
  // Health
  'doctor', 'dentist', 'checkup', 'physical', 'exam', 'appointment', 'therapy', 'counseling',
  'chiropractor', 'massage', 'vaccination',
  
  // Work/Professional
  'meeting', 'presentation', 'conference', 'standup', 'demo', 'review', 'deadline', 'report',
  'memo', 'project',
  
  // Home/Chores
  'laundry', 'dishes', 'trash', 'yard work', 'lawn',
  
  // Finance
  'bills', 'payment', 'taxes', 'insurance',
  
  // Social
  'date', 'party', 'celebration', 'gathering', 'meetup', 'playdate', 'hangout',
  
  // Exercise/Sports
  'practice', 'game', 'match', 'training', 'class', 'session', 'event'
];

/**
 * Check if message is a task-related command (VERY lenient detection)
 */
function isTaskCommand(text: string): boolean {
  // Expand abbreviations first
  const expandedText = expandAbbreviations(text);
  const lowerText = expandedText.toLowerCase();
  
  // Check for explicit task keywords
  if (TASK_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return true;
  }
  
  // Check for task nouns (category-specific)
  for (const noun of TASK_NOUNS) {
    if (lowerText.includes(noun)) {
      return true;
    }
  }
  
  // Check for action verbs ANYWHERE in the sentence
  for (const verb of ACTION_VERBS) {
    if (lowerText.includes(verb)) {
      return true;
    }
  }
  
  // Check if message has date/time indicators
  const hasDateTimeIndicators = /\b(today|tomorrow|tonight|morning|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|weekend|at \d|:\d|am|pm|a\.m|p\.m)\b/i.test(lowerText);
  
  // If it has date/time indicator, assume it's a task (super lenient)
  if (hasDateTimeIndicators) {
    return true;
  }
  
  return false;
}

/**
 * Parse task information from user message
 */
export function parseTaskFromMessage(message: string): ParsedTaskInfo | null {
  // Expand abbreviations first
  const expandedMessage = expandAbbreviations(message);
  const lowerMessage = expandedMessage.toLowerCase();
  
  // Check if it's a task command
  if (!isTaskCommand(expandedMessage)) {
    return null;
  }
  
  // Remove command keywords to get clean title
  let title = expandedMessage;
  const commandPatterns = [
    /remind me to /gi,
    /reminder to /gi,
    /todo: /gi,
    /task: /gi,
    /need to /gi,
    /have to /gi,
    /must /gi,
    /should /gi,
    /don't forget to /gi,
    /remember to /gi,
    /make sure to /gi,
    /make sure /gi,
    /i'll /gi,
    /i will /gi,
  ];
  
  for (const pattern of commandPatterns) {
    title = title.replace(pattern, '');
  }
  
  // Remove date/time phrases from title (comprehensive)
  title = title
    .replace(/\b(at|@|by)\s*\d{1,2}:?\d{0,2}\s*([ap]\.?m\.?)?/gi, '') // at/by 3:00 p.m., at 5pm, by 6pm
    .replace(/\b[ap]\.?m\.?\b/gi, '') // standalone p.m., a.m.
    .replace(/\bin the\s+(morning|afternoon|evening|night)\b/gi, '') // in the morning
    .replace(/\b(morning|afternoon|evening|night)\b/gi, '') // standalone morning/evening
    .replace(/\b(for|on|by|in)\s+(tomorrow|today|tonight|this|next)\b/gi, '') // for tomorrow, on Monday
    .replace(/\b(for|on|by|in)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|week|month)\b/gi, '') // for Monday, by next week
    .replace(/\bby\s+next\s+(week|month|year)\b/gi, '') // by next week
    .replace(/\bnext\s+(week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '') // next week, next Monday
    .replace(/\btomorrow\b/gi, '')
    .replace(/\btoday\b/gi, '')
    .replace(/\btonigh?t\b/gi, '') // tonight (with common typo)
    .replace(/\bthis\s+(morning|afternoon|evening|night|weekend|week|month|year)\b/gi, '')
    .replace(/\bmonday|tuesday|wednesday|thursday|friday|saturday|sunday\b/gi, '')
    .replace(/\bweekend\b/gi, '')
    .replace(/\bweek\b/gi, '') // Remove standalone "week"
    .replace(/\bmonth\b/gi, '') // Remove standalone "month"
    .replace(/\s+/g, ' ') // Clean up multiple spaces
    .replace(/\b(for|at|on|by|in)\s*$/gi, '') // Remove trailing prepositions
    .trim();
  
  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  
  // Detect category
  const category = detectCategory(expandedMessage);
  
  return {
    isTask: true,
    title,
    rawDate: expandedMessage, // Full message for date parsing (with expanded abbreviations)
    rawTime: expandedMessage, // Full message for time parsing (with expanded abbreviations)
    suggestedCategory: category,
  };
}

/**
 * Generate bot response (now with task awareness)
 */
export function generateBotResponse(userMessage: string, taskCreated?: boolean): string {
  const lowerMessage = userMessage.toLowerCase();

  // Task-related keywords
  if (taskCreated) {
    return "✓ Task created!";
  }
  
  if (isTaskCommand(userMessage)) {
    return "Got it! I'll add that to your tasks.";
  }

  // Meal-related keywords
  if (
    lowerMessage.includes('meal') ||
    lowerMessage.includes('recipe') ||
    lowerMessage.includes('food') ||
    lowerMessage.includes('cook') ||
    lowerMessage.includes('eat') ||
    lowerMessage.includes('dinner') ||
    lowerMessage.includes('lunch') ||
    lowerMessage.includes('breakfast')
  ) {
    return "Saving that meal idea for you!";
  }

  // Grocery-related keywords
  if (
    lowerMessage.includes('buy') ||
    lowerMessage.includes('grocery') ||
    lowerMessage.includes('shopping') ||
    lowerMessage.includes('store')
  ) {
    return "I'll add that to your shopping list.";
  }

  // Question words
  if (
    lowerMessage.startsWith('what') ||
    lowerMessage.startsWith('when') ||
    lowerMessage.startsWith('where') ||
    lowerMessage.startsWith('why') ||
    lowerMessage.startsWith('how') ||
    lowerMessage.includes('?')
  ) {
    return "Let me help you with that.";
  }

  // Greeting
  if (
    lowerMessage.includes('hello') ||
    lowerMessage.includes('hi ') ||
    lowerMessage.startsWith('hi') ||
    lowerMessage.includes('hey')
  ) {
    return "Hi! I'm here to help. What's on your mind?";
  }

  // Thanks
  if (
    lowerMessage.includes('thank') ||
    lowerMessage.includes('thanks')
  ) {
    return "You're welcome! Anything else?";
  }

  // Default response
  return "Got it, I've noted that down.";
}

