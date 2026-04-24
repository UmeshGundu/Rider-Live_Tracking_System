/**
 * app/(tabs)/index.tsx - User App "Track Your Order" Screen
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import { ConnectionStatus, LocationPayload, useUserWebSocket } from '@/hooks/use-user-websocket';
import RiderMap, { LatLng } from '@/components/rider-map';

const RIDER_ID = 'RIDER_001';
const MAX_TRAIL = 100;
const BACKEND_HOST = getBackendDisplayHost();
const { height: SCREEN_H } = Dimensions.get('window');
const MAP_HEIGHT = Math.min(SCREEN_H * 0.45, 360);

const statusColor: Record<ConnectionStatus, string> = {
  disconnected: '#E53E3E',
  connecting: '#DD6B20',
  connected: '#38A169',
  error: '#C53030',
};

const statusLabel: Record<ConnectionStatus, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Live',
  error: 'Connection error - retrying...',
};

export default function UserHomeScreen() {
  const { connectionStatus, isConnected, subscribe, fetchLastKnownLocation } = useUserWebSocket();

  const [riderLocation, setRiderLocation] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [showTrail, setShowTrail] = useState(true);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const updateCountRef = useRef(0);
  const hasSubscribed = useRef(false);

  const handleLocationUpdate = useCallback((payload: LocationPayload) => {
    const coord: LatLng = {
      latitude: payload.latitude,
      longitude: payload.longitude,
    };

    setRiderLocation(coord);
    setLastSeen(new Date().toLocaleTimeString());
    updateCountRef.current += 1;
    setUpdateCount(updateCountRef.current);

    setRouteCoords((prev) => {
      const next = [...prev, coord];
      return next.length > MAX_TRAIL ? next.slice(next.length - MAX_TRAIL) : next;
    });
  }, []);

  useEffect(() => {
    if (isConnected && !hasSubscribed.current) {
      hasSubscribed.current = true;
      subscribe(RIDER_ID, handleLocationUpdate);
    }

    if (!isConnected) {
      hasSubscribed.current = false;
    }
  }, [handleLocationUpdate, isConnected, subscribe]);

  useEffect(() => {
    fetchLastKnownLocation(RIDER_ID).then((payload) => {
      if (!payload) return;

      const coord: LatLng = {
        latitude: payload.latitude,
        longitude: payload.longitude,
      };

      setRiderLocation(coord);
      setRouteCoords([coord]);
      setLastSeen('(last known)');
    });
  }, [fetchLastKnownLocation]);

  const clearTrail = useCallback(() => setRouteCoords([]), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Your Order</Text>
        <Text style={styles.headerSub}>Rider is on the way!</Text>
      </View>

      <View style={[styles.statusBar, { backgroundColor: statusColor[connectionStatus] }]}>
        {connectionStatus === 'connecting' && (
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
        )}
        <View
          style={[
            styles.dot,
            { backgroundColor: isConnected ? '#9AE6B4' : '#FEB2B2' },
          ]}
        />
        <Text style={styles.statusText}>{statusLabel[connectionStatus]}</Text>
        {lastSeen && isConnected && <Text style={styles.statusSub}> · {lastSeen}</Text>}
      </View>

      <View style={{ height: MAP_HEIGHT }}>
        <RiderMap
          riderLocation={riderLocation}
          routeCoords={routeCoords}
          showTrail={showTrail}
        />
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelBody}>
        <View style={styles.riderRow}>
          <View style={styles.riderAvatar}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#2B6CB0' }}>R</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.riderName}>Delivery Rider</Text>
            <Text style={styles.riderId}>ID: {RIDER_ID}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{updateCount} updates</Text>
          </View>
        </View>

        {riderLocation ? (
          <View style={styles.coordCard}>
            <Text style={styles.coordLabel}>Current position</Text>
            <Text style={styles.coordValue}>
              {riderLocation.latitude.toFixed(6)}, {riderLocation.longitude.toFixed(6)}
            </Text>
            {lastSeen && <Text style={styles.coordSub}>Updated at {lastSeen}</Text>}
          </View>
        ) : (
          <View style={[styles.coordCard, styles.waitingCard]}>
            <ActivityIndicator size="small" color="#3182CE" />
            <Text style={styles.waitingText}>Waiting for rider...</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.ctrlBtn, showTrail && styles.ctrlBtnActive]}
            onPress={() => setShowTrail((value) => !value)}
          >
            <Text style={styles.ctrlText}>{showTrail ? 'Hide trail' : 'Show trail'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ctrlBtn} onPress={clearTrail}>
            <Text style={styles.ctrlText}>Clear trail</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Subscribed to /topic/rider/{RIDER_ID}
          {'\n'}Server {BACKEND_HOST}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#2B6CB0',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: '#BEE3F8', marginTop: 2 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  statusText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statusSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  panel: { flex: 1 },
  panelBody: { padding: 16, gap: 12 },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderName: { fontSize: 15, fontWeight: '600', color: '#2D3748' },
  riderId: { fontSize: 12, color: '#718096', marginTop: 2 },
  badge: {
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, color: '#2B6CB0', fontWeight: '600' },
  coordCard: {
    backgroundColor: '#EBF8FF',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#3182CE',
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  coordLabel: { fontSize: 12, fontWeight: '600', color: '#2B6CB0', marginBottom: 4 },
  coordValue: {
    fontSize: 15,
    color: '#2C5282',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  coordSub: { fontSize: 12, color: '#4A5568', marginTop: 4 },
  waitingText: { fontSize: 14, color: '#2B6CB0' },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  ctrlBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
  },
  ctrlBtnActive: { backgroundColor: '#BEE3F8' },
  ctrlText: { fontSize: 13, color: '#2D3748', fontWeight: '500' },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#A0AEC0',
    lineHeight: 18,
    marginBottom: 20,
  },
});
