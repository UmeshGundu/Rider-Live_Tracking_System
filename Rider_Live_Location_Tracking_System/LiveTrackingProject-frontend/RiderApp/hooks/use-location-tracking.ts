/**
 * hooks/use-location-tracking.ts
 *
 * Wraps Expo Location.  On start:
 *  - Requests foreground permission (Android + iOS)
 *  - Sets up a watchPositionAsync subscription that fires every ~3 s
 *  - Calls onUpdate(lat, lng, accuracy) for each new position
 *
 * Falls back to a simulated route around Hyderabad when the device
 * has no GPS (emulators without mock location configured).
 */

import { useRef, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationTrackingHook {
  startTracking: (onUpdate: (data: LocationData) => void) => Promise<void>;
  stopTracking: () => void;
}

// Hyderabad route: a loop of ~10 waypoints spaced ≈50 m apart
const SIMULATED_ROUTE: LocationData[] = [
  { latitude: 17.4126, longitude: 78.2676, accuracy: 5 },
  { latitude: 17.4129, longitude: 78.2682, accuracy: 5 },
  { latitude: 17.4133, longitude: 78.2689, accuracy: 5 },
  { latitude: 17.4138, longitude: 78.2695, accuracy: 5 },
  { latitude: 17.4142, longitude: 78.2700, accuracy: 5 },
  { latitude: 17.4138, longitude: 78.2706, accuracy: 5 },
  { latitude: 17.4133, longitude: 78.2711, accuracy: 5 },
  { latitude: 17.4128, longitude: 78.2706, accuracy: 5 },
  { latitude: 17.4123, longitude: 78.2699, accuracy: 5 },
  { latitude: 17.4126, longitude: 78.2676, accuracy: 5 }, // back to start
];

export function useLocationTracking(): LocationTrackingHook {
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulationIndexRef = useRef(0);

  // ── stop ──────────────────────────────────────────────────────────────────
  const stopTracking = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;

    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
  }, []);

  // ── start ─────────────────────────────────────────────────────────────────
  const startTracking = useCallback(
    async (onUpdate: (data: LocationData) => void) => {
      // 1. Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.warn('[Location] Permission denied – using simulated route');
        startSimulation(onUpdate);
        return;
      }

      try {
        // 2. Real GPS – fires whenever position changes or every ~3 s
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,   // ms
            distanceInterval: 5,  // metres – fires if moved ≥5 m even within interval
          },
          (loc) => {
            onUpdate({
              latitude:  loc.coords.latitude,
              longitude: loc.coords.longitude,
              accuracy:  loc.coords.accuracy ?? 0,
            });
          }
        );
        subscriptionRef.current = sub;
      } catch (err) {
        console.warn('[Location] watchPositionAsync failed – using simulation', err);
        startSimulation(onUpdate);
      }
    },
    []
  );

  // ── simulation fallback ────────────────────────────────────────────────────
  const startSimulation = (onUpdate: (data: LocationData) => void) => {
    simulationIndexRef.current = 0;

    // Fire once immediately
    onUpdate(SIMULATED_ROUTE[0]);

    simulationTimerRef.current = setInterval(() => {
      simulationIndexRef.current =
        (simulationIndexRef.current + 1) % SIMULATED_ROUTE.length;
      onUpdate(SIMULATED_ROUTE[simulationIndexRef.current]);
    }, 3000);
  };

  return { startTracking, stopTracking };
}
