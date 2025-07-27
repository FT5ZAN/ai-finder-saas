import { configureStore } from '@reduxjs/toolkit';
import historyReducer from './slices/historySlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    history: historyReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 