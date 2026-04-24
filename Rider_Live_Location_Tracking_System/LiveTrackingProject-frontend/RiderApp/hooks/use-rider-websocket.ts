/**
 * hooks/use-rider-websocket.ts
 *
 * Custom hook that manages the STOMP-over-SockJS connection for the Rider App.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, IFrame } from '@stomp/stompjs';
import 'text-encoding';

import { getBackendWsUrl } from '@/config/backend';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SockJS = require('sockjs-client') as any;

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

interface RiderWebSocketHook {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  sendLocation: (
    riderId: string,
    latitude: number,
    longitude: number,
    accuracy: number
  ) => void;
}

export function useRiderWebSocket(): RiderWebSocketHook {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');

  const clientRef = useRef<Client | null>(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    setConnectionStatus('connecting');

    const client = new Client({
      webSocketFactory: () => new SockJS(getBackendWsUrl()),
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: Math.min(2000 * 2 ** retryCountRef.current, 30_000),

      onConnect: (_frame: IFrame) => {
        console.log('[RiderWS] Connected');
        setConnectionStatus('connected');
        retryCountRef.current = 0;
      },

      onDisconnect: () => {
        console.log('[RiderWS] Disconnected');
        setConnectionStatus('disconnected');
      },

      onStompError: (frame: IFrame) => {
        console.error('[RiderWS] STOMP error', frame.headers.message);
        setConnectionStatus('error');
        retryCountRef.current += 1;
      },

      onWebSocketError: (evt: Event) => {
        console.error('[RiderWS] WS error', evt);
        setConnectionStatus('error');
        retryCountRef.current += 1;
      },
    });

    client.activate();
    clientRef.current = client;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clientRef.current?.deactivate();
    };
  }, [connect]);

  const sendLocation = useCallback(
    (
      riderId: string,
      latitude: number,
      longitude: number,
      accuracy: number
    ) => {
      const client = clientRef.current;
      if (!client?.connected) {
        console.warn('[RiderWS] Not connected - cannot send location');
        return;
      }

      const payload = JSON.stringify({
        riderId,
        latitude,
        longitude,
        accuracy,
        timestamp: Date.now(),
      });

      client.publish({ destination: '/app/location', body: payload });
    },
    []
  );

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    sendLocation,
  };
}
