/**
 * API client for calling the Next.js backend
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface ParsedTask {
  title: string;
  notes: string | null;
  due_date: string | null;
  due_time: string | null;
  category: string | null;
}

interface ParseTaskResponse {
  tasks: ParsedTask[];
  summary?: string;
}

/**
 * Parse task using OpenAI API
 * @param text - User's voice input text
 * @param authToken - User's session access token
 * @returns Parsed task or null if failed
 */
export async function parseTaskWithAPI(
  text: string,
  authToken?: string
): Promise<ParsedTask | null> {
  try {
    console.log('🌐 Calling API to parse task:', text);

    const response = await fetch(`${API_BASE_URL}/api/parseDump`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API error:', error);
      
      if (response.status === 403) {
        console.warn('⚠️ Token quota exceeded');
      }
      
      return null;
    }

    const data: ParseTaskResponse = await response.json();
    
    if (data.tasks && data.tasks.length > 0) {
      console.log('✅ API parsed task:', data.tasks[0]);
      return data.tasks[0];
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to call API:', error);
    return null;
  }
}

