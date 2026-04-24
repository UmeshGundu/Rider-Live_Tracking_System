/**
 * app/(tabs)/index.tsx - Rider App Home Screen
 */

import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { getBackendDisplayHost } from '@/config/backend';
import { ConnectionStatus, useRiderWebSocket } from '@/hooks/use-rider-websocket';
import { useLocationTracking } from '@/hooks/use-location-tracking';

const RIDER_ID = 'RIDER_001';
const BACKEND_HOST = getBackendDisplayHost();

const statusColor: Record<ConnectionStatus, string> = {
  disconnected: '#E53E3E',
  connecting: '#DD6B20',
  connected: '#38A169',
  error: '#C53030',
};

const statusLabel: Record<ConnectionStatus, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
  error: 'Connection error - retrying...',
};

interface LogEntry {
  time: string;
  lat: string;
  lng: string;
}

export default function RiderHomeScreen() {
  const { isConnected, connectionStatus, sendLocation } = useRiderWebSocket();
  const { startTracking, stopTracking } = useLocationTracking();

  const [isTracking, setIsTracking] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const updateCountRef = useRef(0);

  const handleStart = useCallback(async () => {
    if (!isConnected) {
      Alert.alert('Not connected', 'Please wait for the WebSocket connection.');
      return;
    }

    setIsTracking(true);

    await startTracking(({ latitude, longitude, accuracy: nextAccuracy }) => {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
      setAccuracy(nextAccuracy);
      updateCountRef.current += 1;
      setUpdateCount(updateCountRef.current);

      const time = new Date().toLocaleTimeString();
      setLog((prev) =>
        [{ time, lat: latitude.toFixed(6), lng: longitude.toFixed(6) }, ...prev].slice(0, 20)
      );

      sendLocation(RIDER_ID, latitude, longitude, nextAccuracy);
    });
  }, [isConnected, sendLocation, startTracking]);

  const handleStop = useCallback(() => {
    stopTracking();
    setIsTracking(false);
  }, [stopTracking]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerEmoji}>Rider</Text>
        <Text style={styles.headerTitle}>Rider App</Text>
        <Text style={styles.headerSub}>Live Location Tracking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Rider ID: {RIDER_ID}</Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: statusColor[connectionStatus] }]}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: isConnected ? '#9AE6B4' : '#FEB2B2' },
              ]}
            />
            <Text style={styles.statusText}>{statusLabel[connectionStatus]}</Text>
            {connectionStatus === 'connecting' && (
              <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
            )}
          </View>
        </View>

        {currentLat !== null ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current GPS Position</Text>
            <Text style={styles.coord}>Lat {currentLat.toFixed(6)}</Text>
            <Text style={styles.coord}>Lng {currentLng?.toFixed(6)}</Text>
            {accuracy !== null && (
              <Text style={styles.meta}>Accuracy +/- {accuracy.toFixed(1)} m</Text>
            )}
            <Text style={styles.meta}>Updates sent {updateCount}</Text>
          </View>
        ) : (
          <View style={[styles.card, styles.placeholderCard]}>
            <Text style={styles.placeholderText}>
              {isTracking ? 'Waiting for first GPS fix...' : 'Tap Start Tracking to begin'}
            </Text>
          </View>
        )}

        <View style={styles.btnRow}>
          {!isTracking ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnGreen, !isConnected && styles.btnDisabled]}
              onPress={handleStart}
              disabled={!isConnected}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>Start Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, styles.btnRed]}
              onPress={handleStop}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location Log (last 20)</Text>
          {log.length === 0 ? (
            <Text style={styles.placeholderText}>No updates yet</Text>
          ) : (
            log.map((entry, index) => (
              <Text key={index} style={styles.logEntry}>
                [{entry.time}] {entry.lat}, {entry.lng}
              </Text>
            ))
          )}
        </View>

        <Text style={styles.footer}>
          Server {BACKEND_HOST}
          {'\n'}Interval 3 s · Topic /topic/rider/{RIDER_ID}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    backgroundColor: '#C53030',
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerEmoji: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  headerSub: { fontSize: 13, color: '#FED7D7', marginTop: 2 },
  body: { padding: 16, gap: 12 },
  badge: {
    backgroundColor: '#FED7D7',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FC8181',
  },
  badgeText: { fontSize: 15, fontWeight: '700', color: '#C53030' },
  statusCard: {
    borderRadius: 10,
    padding: 14,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderCard: { alignItems: 'center', paddingVertical: 24 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748', marginBottom: 10 },
  coord: {
    fontSize: 17,
    color: '#2B6CB0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  meta: { fontSize: 13, color: '#718096', marginTop: 4 },
  placeholderText: { color: '#A0AEC0', fontStyle: 'italic' },
  btnRow: { gap: 10 },
  btn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGreen: { backgroundColor: '#38A169' },
  btnRed: { backgroundColor: '#E53E3E' },
  btnDisabled: { backgroundColor: '#A0AEC0' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logEntry: {
    fontSize: 12,
    color: '#4A5568',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EDF2F7',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#A0AEC0',
    lineHeight: 18,
    marginBottom: 20,
  },
});
