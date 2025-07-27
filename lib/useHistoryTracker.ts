import { useAppDispatch } from './hooks';
import { addToolToHistory } from './slices/historySlice';

export const useHistoryTracker = () => {
  const dispatch = useAppDispatch();

  const trackToolVisit = (toolData: {
    id: string;
    name: string;
    logo: string;
    url: string;
  }) => {
    dispatch(addToolToHistory(toolData));
  };

  return { trackToolVisit };
}; 