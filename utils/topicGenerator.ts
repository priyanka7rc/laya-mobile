import { Message } from '../types/conversation';

// Common greetings to filter out
const GREETINGS = new Set([
  'hi', 'hello', 'hey', 'hola', 'greetings', 'good morning', 'good afternoon',
  'good evening', 'good night', 'morning', 'afternoon', 'evening', 'night',
  'howdy', 'sup', 'whats up', 'wassup', 'yo', 'hiya', 'heya'
]);

/**
 * Check if a message is just a greeting
 */
function isGreeting(message: string): boolean {
  const normalized = message.toLowerCase().trim().replace(/[^a-z\s]/g, '');
  const words = normalized.split(/\s+/);
  
  // Check if entire message is a greeting
  if (GREETINGS.has(normalized)) {
    return true;
  }
  
  // Check if message is short and starts with greeting
  if (words.length <= 3 && words.some(w => GREETINGS.has(w))) {
    return true;
  }
  
  return false;
}

/**
 * Generates a conversation topic from messages
 * Option E: Skip greetings, use first substantive message
 */
export function generateTopic(messages: Message[]): string {
  if (messages.length === 0) {
    return 'New Conversation';
  }

  // Get user messages only
  const userMessages = messages.filter(m => m.role === 'user');

  if (userMessages.length === 0) {
    return 'New Conversation';
  }

  // Find first substantive (non-greeting) message
  const substantiveMessage = userMessages.find(m => {
    const content = m.content.trim();
    const wordCount = content.split(/\s+/).length;
    return !isGreeting(content) && wordCount > 2;
  });

  // If we found a substantive message, use it directly
  if (substantiveMessage) {
    const content = substantiveMessage.content.trim();
    // Use first 50 chars of the message
    if (content.length <= 50) {
      return capitalize(content);
    }
    // Truncate at word boundary
    const truncated = content.slice(0, 47);
    const lastSpace = truncated.lastIndexOf(' ');
    return capitalize(truncated.slice(0, lastSpace > 0 ? lastSpace : 47)) + '...';
  }

  // Fallback: use first message even if it's a greeting
  const firstMessage = userMessages[0].content.trim();
  if (firstMessage.length <= 50) {
    return capitalize(firstMessage);
  }
  return capitalize(firstMessage.slice(0, 47)) + '...';
}

function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Format relative time for conversation cards
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // Format as date for older conversations
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

