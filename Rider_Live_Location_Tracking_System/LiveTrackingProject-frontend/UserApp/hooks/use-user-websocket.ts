/**
 * hooks/use-user-websocket.ts
 *
 * Custom hook for the User App.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';
import 'text-encoding';

import { getBackendOrigin, getBackendWsUrl } from '@/config/backend';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SockJS = require('sockjs-client') as any;

export interface LocationPayload {
  riderId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

interface UserWebSocketHook {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  subscribe: (
    riderId: string,
    onUpdate: (payload: LocationPayload) => void
  ) => void;
  unsubscribe: () => void;
  fetchLastKnownLocation: (riderId: string) => Promise<LocationPayload | null>;
}

export function useUserWebSocket(): UserWebSocketHook {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');

  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(getBackendWsUrl()),
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: Math.min(2000 * 2 ** retryRef.current, 30_000),

      onConnect: (_frame: IFrame) => {
        console.log('[UserWS] Connected');
        setConnectionStatus('connected');
        retryRef.current = 0;
      },
      onDisconnect: () => {
        console.log('[UserWS] Disconnected');
        setConnectionStatus('disconnected');
      },
      onStompError: (frame: IFrame) => {
        console.error('[UserWS] STOMP error', frame.headers.message);
        setConnectionStatus('error');
        retryRef.current += 1;
      },
      onWebSocketError: () => {
        setConnectionStatus('error');
        retryRef.current += 1;
      },
    });

    setConnectionStatus('connecting');
    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionRef.current?.unsubscribe();
      client.deactivate();
    };
  }, []);

  const subscribe = useCallback(
    (riderId: string, onUpdate: (payload: LocationPayload) => void) => {
      const client = clientRef.current;
      if (!client?.connected) {
        console.warn('[UserWS] Not connected - cannot subscribe yet');
        const interval = setInterval(() => {
          if (clientRef.current?.connected) {
            clearInterval(interval);
            doSubscribe(riderId, onUpdate);
          }
        }, 500);
        return;
      }
      doSubscribe(riderId, onUpdate);
    },
    []
  );

  const doSubscribe = (
    riderId: string,
    onUpdate: (payload: LocationPayload) => void
  ) => {
    subscriptionRef.current?.unsubscribe();

    const destination = `/topic/rider/${riderId}`;
    const sub = clientRef.current!.subscribe(destination, (message: IMessage) => {
      try {
        const data: LocationPayload = JSON.parse(message.body);
        onUpdate(data);
      } catch (error) {
        console.error('[UserWS] Failed to parse message', error);
      }
    });

    subscriptionRef.current = sub;
    console.log(`[UserWS] Subscribed to ${destination}`);
  };

  const unsubscribe = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
  }, []);

  const fetchLastKnownLocation = useCallback(
    async (riderId: string): Promise<LocationPayload | null> => {
      try {
        const res = await fetch(`${getBackendOrigin()}/api/location/${riderId}/last`);
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.latitude == null) return null;
        return data as LocationPayload;
      } catch (error) {
        console.warn('[UserWS] fetchLastKnownLocation failed', error);
        return null;
      }
    },
    []
  );

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    subscribe,
    unsubscribe,
    fetchLastKnownLocation,
  };
}
