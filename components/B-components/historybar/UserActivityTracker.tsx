'use client';
import { useUserActivity } from '../../../lib/useUserActivity';

const UserActivityTracker = () => {
  useUserActivity();
  return null; // This component doesn't render anything
};

export default UserActivityTracker; 