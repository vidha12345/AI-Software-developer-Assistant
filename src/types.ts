export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  timestamp: string;
}

export interface SavedSnippet {
  id: string;
  userId: string;
  title: string;
  code: string;
  language: string;
  description: string;
  timestamp: string;
}

export interface BugTicket {
  id: string;
  userId: string;
  title: string;
  description: string;
  codeSnippet: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  aiAnalysis: string;
  resolutionSuggestion: string;
  timestamp: string;
}

export interface UsageMetric {
  category: string;
  count: number;
}

export interface AnalyticsData {
  totalAIOperations: number;
  snippetCount: number;
  bugCount: number;
  categoryBreakdown: UsageMetric[];
  recentActivity: {
    id: string;
    description: string;
    time: string;
    type: 'chat' | 'generate' | 'debug' | 'review' | 'docs' | 'tests' | 'bug' | 'snippet';
  }[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  systemInstruction: string;
  temperature: number;
}
