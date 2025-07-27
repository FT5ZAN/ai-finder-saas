import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number; // Store as timestamp number instead of Date object
  tools?: ToolResult[];
  moreLink?: string;
  isExactMatch?: boolean;
  toolNotFound?: boolean;
  complaintMessage?: string;
  missingTool?: string;
  missingCategory?: string;
}

export interface ToolResult {
  id: string;
  title: string;
  logoUrl: string;
  websiteUrl: string;
  likeCount: number;
  saveCount: number;
  toolType?: 'browser' | 'downloadable';
  about?: string;
  category?: string;
  keywords?: string[];
}

interface ChatState {
  messages: ChatMessage[];
  lastActivity: number;
  maxAge: number; // 1 hour in milliseconds
}

// Load initial state from localStorage
const loadChatFromStorage = (): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('aiChatMessages');
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Ensure timestamps are numbers
    return parsed.map((msg: ChatMessage) => ({
      ...msg,
      timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : Date.now()
    }));
  } catch (error) {
    console.error('Error loading chat from localStorage:', error);
    return [];
  }
};

// Get last activity timestamp
const getLastActivity = (): number => {
  if (typeof window === 'undefined') return Date.now();
  
  try {
    const stored = localStorage.getItem('aiChatLastActivity');
    return stored ? parseInt(stored) : Date.now();
  } catch (error) {
    console.error('Error loading last activity from localStorage:', error);
    return Date.now();
  }
};

const initialState: ChatState = {
  messages: loadChatFromStorage(),
  lastActivity: getLastActivity(),
  maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      state.lastActivity = Date.now();
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aiChatMessages', JSON.stringify(state.messages));
          localStorage.setItem('aiChatLastActivity', state.lastActivity.toString());
        } catch (error) {
          console.error('Error saving chat to localStorage:', error);
        }
      }
    },
    
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
      state.lastActivity = Date.now();
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aiChatMessages', JSON.stringify(state.messages));
          localStorage.setItem('aiChatLastActivity', state.lastActivity.toString());
        } catch (error) {
          console.error('Error saving chat to localStorage:', error);
        }
      }
    },
    
    clearChat: (state) => {
      state.messages = [];
      state.lastActivity = Date.now();
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('aiChatMessages');
          localStorage.removeItem('aiChatLastActivity');
        } catch (error) {
          console.error('Error clearing chat from localStorage:', error);
        }
      }
    },
    
    clearChatForLogout: (state) => {
      state.messages = [];
      state.lastActivity = Date.now();
      
      // Clear localStorage for logout
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('aiChatMessages');
          localStorage.removeItem('aiChatLastActivity');
          // Also clear any other potential chat keys
          const keysToRemove = Object.keys(localStorage).filter(key => 
            key.includes('aiChat') || key.includes('chat')
          );
          keysToRemove.forEach(key => localStorage.removeItem(key));
          // Chat cleared for user logout
        } catch (error) {
          console.error('Error clearing chat from localStorage:', error);
        }
      }
    },
    
    cleanupOldMessages: (state) => {
      const now = Date.now();
      const cutoffTime = now - state.maxAge;
      
      // Remove messages older than 1 hour
      const originalLength = state.messages.length;
      state.messages = state.messages.filter(msg => 
        msg.timestamp > cutoffTime
      );
      
      if (state.messages.length < originalLength) {
        state.lastActivity = now;
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('aiChatMessages', JSON.stringify(state.messages));
            localStorage.setItem('aiChatLastActivity', state.lastActivity.toString());
            // Cleaned up old chat messages
          } catch (error) {
            console.error('Error saving cleaned chat to localStorage:', error);
          }
        }
      }
    },
    
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aiChatLastActivity', state.lastActivity.toString());
        } catch (error) {
          console.error('Error updating last activity in localStorage:', error);
        }
      }
    },
  },
});

export const { 
  addMessage, 
  setMessages, 
  clearChat, 
  clearChatForLogout,
  cleanupOldMessages,
  updateLastActivity
} = chatSlice.actions;

export default chatSlice.reducer; 