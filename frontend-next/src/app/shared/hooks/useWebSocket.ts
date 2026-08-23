'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

type ReadyState = 0 | 1 | 2 | 3; // CONNECTING | OPEN | CLOSING | CLOSED

interface UseWebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
}

export function useWebSocket(
  url: string,
  onMessage: (data: unknown) => void,
  options: UseWebSocketOptions = {},
) {
  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [readyState, setReadyState] = useState<ReadyState>(3);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      ws.current = new WebSocket(url);
      setReadyState(0);

      ws.current.onopen = () => {
        setReadyState(1);
        reconnectCount.current = 0;
        onOpen?.();
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          onMessageRef.current(data);
        } catch {
          onMessageRef.current(event.data);
        }
      };

      ws.current.onerror = (event: Event) => {
        console.error('[WebSocket] Error:', event);
        onError?.(event);
      };

      ws.current.onclose = () => {
        setReadyState(3);
        onClose?.();

        // Auto-reconnect with backoff
        if (reconnectCount.current < maxReconnectAttempts) {
          reconnectCount.current += 1;
          const delay = reconnectInterval * Math.min(reconnectCount.current, 3);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };
    } catch (err) {
      console.error('[WebSocket] Connection failed:', err);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onOpen, onClose, onError]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectCount.current = maxReconnectAttempts; // Prevent reconnection
    ws.current?.close();
  }, [maxReconnectAttempts]);

  return { readyState, send, disconnect };
}
