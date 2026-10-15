"use client";

import { useEffect, useState, useCallback } from "react";

export function useRealtimeTicket(ticketId: string, onUpdate?: () => void) {
  const [isConnected, setIsConnected] = useState(false);

  const triggerUpdate = useCallback(() => {
    if (onUpdate) onUpdate();
  }, [onUpdate]);

  useEffect(() => {
    if (!ticketId) return;

    let eventSource: EventSource | null = null;
    let fallbackPoll: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource(`/api/tickets/${ticketId}/stream`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "NEW_MESSAGES" || data.type === "STATUS_UPDATE") {
            triggerUpdate();
          }
        } catch (e) {
          console.error("Error parsing SSE event:", e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Fallback to 3-second smart polling if SSE is interrupted
        if (!fallbackPoll) {
          fallbackPoll = setInterval(triggerUpdate, 3500);
        }
      };
    } catch (e) {
      // Direct polling fallback
      fallbackPoll = setInterval(triggerUpdate, 3500);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackPoll) clearInterval(fallbackPoll);
    };
  }, [ticketId, triggerUpdate]);

  return { isConnected };
}
