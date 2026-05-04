import { useEffect, useRef, useCallback } from 'react';

const QUEUE_KEY = 'offline_checkin_queue';

// ── Queue helpers ────────────────────────────────────────────────────────────

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(item) {
  const queue = getQueue();
  queue.push({ ...item, queuedAt: Date.now() });
  saveQueue(queue);
}

function dequeue(id) {
  const queue = getQueue().filter(item => item.id !== id);
  saveQueue(queue);
}

// ── Sync engine hook ─────────────────────────────────────────────────────────

/**
 * useOfflineQueue
 *
 * @param {boolean}  isOnline   - current network status
 * @param {function} onSync     - callback(syncedItem) called after each item is
 *                                 successfully sent to server; gives GuestList
 *                                 a chance to refresh / replace optimistic data
 * @param {object}   api        - axios instance
 */
export function useOfflineQueue({ isOnline, onSync, api }) {
  const syncingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (syncingRef.current) return;
    const queue = getQueue();
    if (queue.length === 0) return;

    syncingRef.current = true;

    for (const item of queue) {
      try {
        let response;

        if (item.type === 'check-in') {
          response = await api.post('/check-in', {
            guest_id: item.guest_id,
            pax: item.pax,
          });
          onSync?.({ type: 'check-in', data: response.data.data });

        } else if (item.type === 'manual-check-in') {
          response = await api.post('/manual-check-in', {
            name: item.name,
            pax: item.pax,
            address: item.address,
          });
          onSync?.({ type: 'manual-check-in', data: response.data.data, tempId: item.tempId });

        } else if (item.type === 'undo-check-in') {
          response = await api.delete(`/check-in/${item.guest_id}`);
          onSync?.({ type: 'undo-check-in', data: response.data });

        } else if (item.type === 'update-check-in') {
          response = await api.put(`/check-in/${item.guest_id}`, { pax: item.pax });
          onSync?.({ type: 'update-check-in', data: response.data.data });
        }

        dequeue(item.id);
      } catch (err) {
        console.warn('Offline sync failed for item', item.id, err);
        break;
      }
    }

    syncingRef.current = false;
  }, [api, onSync]);

  // Auto-process whenever we come back online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return { processQueue, getQueue };
}
