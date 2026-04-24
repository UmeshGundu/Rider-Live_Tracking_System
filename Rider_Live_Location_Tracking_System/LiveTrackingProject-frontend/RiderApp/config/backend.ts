import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = '8080';

function isTunnelHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized.endsWith('.exp.direct') ||
    normalized.endsWith('.exp.host') ||
    normalized.includes('ngrok') ||
    normalized.includes('tunnel')
  );
}

function isLikelyReachableLocalHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();

  if (!normalized) return false;
  if (normalized === 'localhost' || normalized === '127.0.0.1') return true;

  return /^\d{1,3}(\.\d{1,3}){3}$/.test(normalized);
}

function normalizeOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/+$/, '');
  }
  return `http://${trimmed.replace(/\/+$/, '')}`;
}

function extractHostname(candidate: string | null | undefined): string | null {
  if (!candidate) return null;

  try {
    const withScheme =
      candidate.startsWith('http://') ||
      candidate.startsWith('https://') ||
      candidate.startsWith('exp://') ||
      candidate.startsWith('exps://')
        ? candidate
        : `http://${candidate}`;

    const url = new URL(withScheme);
    return url.hostname || null;
  } catch {
    const cleaned = candidate.replace(/^[a-z]+:\/\//i, '');
    const hostname = cleaned.split('/')[0]?.split(':')[0];
    return hostname || null;
  }
}

function getExplicitHost(): string {
  return (process.env.EXPO_PUBLIC_BACKEND_HOST ?? '').trim();
}

function getExpoDebuggerHost(): string | null {
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  return extractHostname(debuggerHost);
}

function getAutoDetectedHost(): string | null {
  const candidates = [
    getExpoDebuggerHost(),
    extractHostname(Constants.expoConfig?.hostUri),
    extractHostname(Constants.platform?.hostUri),
    extractHostname(Constants.linkingUri),
    extractHostname(Constants.experienceUrl),
  ];

  for (const host of candidates) {
    if (!host) continue;
    if (isTunnelHost(host) && !isLikelyReachableLocalHost(host)) continue;
    return `${host}:${BACKEND_PORT}`;
  }

  return null;
}

export function getBackendOrigin(): string {
  const explicitUrl = normalizeOrigin(process.env.EXPO_PUBLIC_BACKEND_URL ?? '');
  if (explicitUrl) return explicitUrl;

  const explicitHost = getExplicitHost();
  if (explicitHost) return `http://${explicitHost}`;

  if (Platform.OS === 'web') {
    return `http://localhost:${BACKEND_PORT}`;
  }

  const autoDetectedHost = getAutoDetectedHost();
  if (autoDetectedHost) {
    return `http://${autoDetectedHost}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
}

export function getBackendWsUrl(): string {
  return `${getBackendOrigin()}/ws`;
}

export function getBackendDisplayHost(): string {
  return getBackendOrigin().replace(/^https?:\/\//, '');
}
