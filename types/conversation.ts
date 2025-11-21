export type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
};

export type Conversation = {
  id: string;
  topic: string;
  messages: Message[];
  lastMessageTime: Date;
  status: 'active' | 'saved';
};

