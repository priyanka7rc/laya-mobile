/**
 * Detect task category from keywords
 */

type CategoryKeywords = {
  [category: string]: string[];
};

const CATEGORY_KEYWORDS: CategoryKeywords = {
  // Finance checked FIRST to catch "bank appointment" before "appointment" triggers Health
  'Finance': [
    'pay', 'bill', 'bank', 'money', 'transfer', 'payment', 'invoice',
    'budget', 'taxes', 'tax', 'insurance', 'atm', 'account'
  ],
  'Shopping': [
    'buy', 'purchase', 'shop', 'store', 'grocery', 'groceries', 'milk', 'bread',
    'get from', 'pick up', 'eggs', 'meat', 'vegetables', 'fruits', 'food'
  ],
  'Meals': [
    'cook', 'meal', 'recipe', 'dinner', 'lunch', 'breakfast', 'eat', 'food',
    'prepare', 'make dinner', 'bake', 'grill', 'restaurant'
  ],
  'Work': [
    'meeting', 'call', 'email', 'send', 'report', 'project', 'deadline',
    'presentation', 'review', 'submit', 'office', 'work', 'client', 'boss'
  ],
  'Health': [
    'doctor', 'appointment', 'gym', 'workout', 'exercise', 'run', 'yoga',
    'medicine', 'health', 'checkup', 'dentist', 'hospital', 'therapy', 'physical'
  ],
  'Home': [
    'clean', 'laundry', 'dishes', 'vacuum', 'organize', 'fix', 'repair',
    'maintenance', 'chore', 'trash', 'garbage', 'tidy'
  ],
  'Personal': [
    'birthday', 'anniversary', 'gift', 'family', 'friend', 'mom', 'dad',
    'call mom', 'call dad', 'visit', 'party'
  ],
};

/**
 * Detect category from task text
 */
export function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Default category
  return 'Tasks';
}

