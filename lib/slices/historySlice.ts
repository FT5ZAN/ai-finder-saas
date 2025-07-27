import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToolHistory {
  id: string;
  name: string;
  logo: string;
  url: string;
  visitedAt: number;
}

interface HistoryState {
  tools: ToolHistory[];
  maxItems: number;
}

// Load initial state from localStorage (unused but kept for future use)
// const loadHistoryFromStorage = (): ToolHistory[] => {
//   if (typeof window === 'undefined') return [];
//   
//   try {
//     const stored = localStorage.getItem('toolHistory');
//     return stored ? JSON.parse(stored) : [];
//   } catch (error) {
//     console.error('Error loading history from localStorage:', error);
//     return [];
//   }
// };

const initialState: HistoryState = {
  tools: [], // Start with empty array, will be loaded on client
  maxItems: 5, // Maximum number of tools to keep in history (FIFO behavior)
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addToolToHistory: (state, action: PayloadAction<Omit<ToolHistory, 'visitedAt'>>) => {
      const newTool: ToolHistory = {
        ...action.payload,
        visitedAt: Date.now(),
      };

      // Check if tool already exists (by ID or URL)
      const existingToolIndex = state.tools.findIndex(tool => 
        tool.id === newTool.id || tool.url === newTool.url
      );

      if (existingToolIndex !== -1) {
        // Update the existing tool's timestamp and move it to the front
        state.tools[existingToolIndex].visitedAt = newTool.visitedAt;
        const updatedTool = state.tools.splice(existingToolIndex, 1)[0];
        state.tools.unshift(updatedTool);
      } else {
        // Add new tool to the beginning
        state.tools.unshift(newTool);
      }
      
      // Always enforce FIFO limit after any modification
      if (state.tools.length > state.maxItems) {
        state.tools = state.tools.slice(0, state.maxItems);
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('toolHistory', JSON.stringify(state.tools));
        } catch (error) {
          console.error('Error saving history to localStorage:', error);
        }
      }
    },
    
    removeToolFromHistory: (state, action: PayloadAction<string>) => {
      state.tools = state.tools.filter(tool => tool.id !== action.payload);
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('toolHistory', JSON.stringify(state.tools));
        } catch (error) {
          console.error('Error saving history to localStorage:', error);
        }
      }
    },
    
    clearHistory: (state) => {
      state.tools = [];
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('toolHistory');
        } catch (error) {
          console.error('Error clearing history from localStorage:', error);
        }
      }
    },
    
    setMaxItems: (state, action: PayloadAction<number>) => {
      state.maxItems = action.payload;
      
      // Trim history if needed
      if (state.tools.length > state.maxItems) {
        state.tools = state.tools.slice(0, state.maxItems);
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('toolHistory', JSON.stringify(state.tools));
          } catch (error) {
            console.error('Error saving history to localStorage:', error);
          }
        }
      }
    },
    
    clearHistoryForNewUser: (state) => {
      state.tools = [];
      
      // Clear localStorage for new user
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('toolHistory');
          // Also clear any other potential history keys
          const keysToRemove = Object.keys(localStorage).filter(key => 
            key.includes('toolHistory') || key.includes('history')
          );
          keysToRemove.forEach(key => localStorage.removeItem(key));

        } catch (error) {
          console.error('Error clearing history from localStorage:', error);
        }
      }
    },
  },
});

export const { 
  addToolToHistory, 
  removeToolFromHistory, 
  clearHistory, 
  setMaxItems,
  clearHistoryForNewUser
} = historySlice.actions;

export default historySlice.reducer; 