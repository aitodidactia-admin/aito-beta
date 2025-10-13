const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:5001/api';

export interface User {
  userId: string;
  username: string;
  ipAddress: string;
  totalSessions: number;
}

export interface ConversationSession {
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationData {
  messages: Message[];
  summary?: string;
  topics?: string[];
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 Making API request to:', url, 'with options:', options);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log('📡 API response:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createOrGetUser(ipAddress: string): Promise<{ success: boolean; user: User }> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ ipAddress }),
    });
  }

  async updateUsername(userId: string, username: string): Promise<{ success: boolean; user: User }> {
    return this.request(`/users/${userId}/username`, {
      method: 'PUT',
      body: JSON.stringify({ username }),
    });
  }

  async startSession(userId: string, ipAddress: string): Promise<{ success: boolean; session: ConversationSession }> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId, ipAddress }),
    });
  }

  async endSession(sessionId: string, conversationData?: ConversationData): Promise<{ success: boolean; session: ConversationSession }> {
    return this.request(`/sessions/${sessionId}/end`, {
      method: 'PUT',
      body: JSON.stringify({ conversationData }),
    });
  }

  async addMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<{ success: boolean }> {
    return this.request(`/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ role, content }),
    });
  }

  async getUserSessions(userId: string): Promise<{ success: boolean; sessions: ConversationSession[] }> {
    return this.request(`/users/${userId}/sessions`);
  }

  async getSession(sessionId: string): Promise<{ success: boolean; session: ConversationSession & { conversationData: ConversationData } }> {
    return this.request(`/sessions/${sessionId}`);
  }

  async getClientIP(): Promise<string> {
    try {
      // Try to get IP from a public service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not get external IP, using localhost');
      return '127.0.0.1';
    }
  }

  async submitFeedback(feedbackData: {
    name: string;
    email?: string;
    message: string;
    rating: number;
    category: string;
  }): Promise<{ success: boolean; feedbackId?: string; message?: string }> {
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    return this.request('/admin/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
}

export const apiService = new ApiService();
