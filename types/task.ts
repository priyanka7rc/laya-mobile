export type Task = {
  id: string;
  title: string;
  due_date: string | null; // YYYY-MM-DD format
  due_time: string | null; // HH:MM format
  category: string | null;
  is_done: boolean;
  created_at: Date;
  user_id?: string; // For Supabase integration later
};

export type ParsedTaskInfo = {
  isTask: boolean;
  title: string;
  rawDate?: string;
  rawTime?: string;
  suggestedCategory?: string;
};

