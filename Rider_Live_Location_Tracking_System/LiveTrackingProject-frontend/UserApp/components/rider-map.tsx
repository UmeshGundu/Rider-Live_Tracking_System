/**
 * components/rider-map.tsx
 *
 * Cross-platform map wrapper.
 *
 * • Native (iOS / Android) – uses react-native-maps with an animated
 *   Marker that smoothly interpolates between GPS positions using the
 *   built-in MapView.animateCamera().
 *
 * • Web – react-native-maps doesn't render in a browser.
 *   We fall back to a styled div that shows the raw coordinates and a
 *   simple SVG "moving dot" so the feature is still demonstrable on web.
 *
 * Props:
 *   riderLocation  – current { latitude, longitude } or null
 *   routeCoords    – array of { latitude, longitude } for the trail polyline
 *   showTrail      – whether to render the Polyline
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export interface LatLng {
  latitude:  number;
  longitude: number;
}

interface RiderMapProps {
  riderLocation: LatLng | null;
  routeCoords:   LatLng[];
  showTrail:     boolean;
}

// ─── Native map ───────────────────────────────────────────────────────────────
// react-native-maps is loaded lazily so the web bundle doesn't crash trying
// to import it (it has native-only dependencies).
let MapView: any = null;
let Marker:  any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RNMaps = require('react-native-maps');
  MapView  = RNMaps.default;
  Marker   = RNMaps.Marker;
  Polyline = RNMaps.Polyline;
}

// Default region – Hyderabad, India
const DEFAULT_REGION = {
  latitude:       17.4126,
  longitude:      78.2676,
  latitudeDelta:  0.01,
  longitudeDelta: 0.01,
};

// ─────────────────────────────────────────────────────────────────────────────

export default function RiderMap({ riderLocation, routeCoords, showTrail }: RiderMapProps) {
  const mapRef = useRef<any>(null);

  // Smoothly pan the camera to the rider whenever position changes
  useEffect(() => {
    if (riderLocation && mapRef.current && Platform.OS !== 'web') {
      mapRef.current.animateCamera(
        {
          center: {
            latitude:  riderLocation.latitude,
            longitude: riderLocation.longitude,
          },
          zoom: 16,
        },
        { duration: 800 }
      );
    }
  }, [riderLocation]);

  // ── Web fallback ───────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webTitle}>🗺️  Live Rider Position</Text>
        {riderLocation ? (
          <>
            <View style={styles.webDot} />
            <Text style={styles.webCoord}>
              {riderLocation.latitude.toFixed(6)},{'\n'}
              {riderLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.webNote}>
              react-native-maps is not supported on web.{'\n'}
              Run on Android / iOS to see the live map.
            </Text>
          </>
        ) : (
          <Text style={styles.webNote}>Waiting for rider location…</Text>
        )}
      </View>
    );
  }

  // ── Native map ─────────────────────────────────────────────────────────────
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={
        riderLocation
          ? {
              ...riderLocation,
              latitudeDelta:  0.01,
              longitudeDelta: 0.01,
            }
          : DEFAULT_REGION
      }
      showsUserLocation
      showsMyLocationButton
    >
      {/* Rider pin – updates position as new coords arrive */}
      {riderLocation && (
        <Marker
          coordinate={riderLocation}
          title="Rider"
          description="Live position"
          pinColor="#E53E3E"
        />
      )}

      {/* Route trail */}
      {showTrail && routeCoords.length > 1 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor="#E53E3E"
          strokeWidth={3}
          lineDashPattern={[6, 3]}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  // ── web fallback ────────────────────────────────────────────────────────
  webFallback: {
    flex: 1,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  webTitle: { fontSize: 18, fontWeight: '700', color: '#2B6CB0' },
  webDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E53E3E',
  },
  webCoord: {
    fontSize: 20,
    color: '#2C5282',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  webNote: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
});
