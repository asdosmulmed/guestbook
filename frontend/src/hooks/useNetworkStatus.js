import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const PING_URL = `${API_URL}/api/ping`;
const CHECK_INTERVAL_MS = 5000; // ping every 5 seconds

async function checkServerReachable() {
  try {
    const res = await fetch(PING_URL, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(3000), // 3s timeout
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true); // assume online initially
  const intervalRef = useRef(null);

  const runCheck = async () => {
    const reachable = await checkServerReachable();
    setIsOnline(reachable);
  };

  useEffect(() => {
    // Check immediately on mount
    runCheck();

    // Periodic check every 5 seconds
    intervalRef.current = setInterval(runCheck, CHECK_INTERVAL_MS);

    // Also listen to browser online/offline events for instant response
    const goOffline = () => {
      setIsOnline(false);
      clearInterval(intervalRef.current);
    };

    const goOnline = () => {
      // Don't trust browser's 'online' event alone - verify with a real request
      runCheck();
      intervalRef.current = setInterval(runCheck, CHECK_INTERVAL_MS);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}
