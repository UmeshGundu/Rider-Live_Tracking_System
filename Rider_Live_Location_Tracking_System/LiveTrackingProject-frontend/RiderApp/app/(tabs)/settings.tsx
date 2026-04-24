/**
 * app/(tabs)/settings.tsx - Rider App Settings
 */

import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBackendDisplayHost } from '@/config/backend';

export default function SettingsScreen() {
  const [riderId, setRiderId] = useState('RIDER_001');
  const [server, setServer] = useState(getBackendDisplayHost());

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.heading}>Settings</Text>

        <View style={styles.group}>
          <Text style={styles.label}>Rider ID</Text>
          <TextInput
            style={styles.input}
            value={riderId}
            onChangeText={setRiderId}
            placeholder="e.g. RIDER_001"
            placeholderTextColor="#A0AEC0"
            autoCapitalize="characters"
          />
          <Text style={styles.hint}>Must match the order assigned to you.</Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Server address</Text>
          <TextInput
            style={styles.input}
            value={server}
            onChangeText={setServer}
            placeholder="192.168.1.100:8080"
            placeholderTextColor="#A0AEC0"
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Expo Go auto-detects your dev machine IP when possible.{'\n'}
            Android emulator fallback {'->'} 10.0.2.2:8080{'\n'}
            Web/iOS simulator fallback {'->'} localhost:8080
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>WebSocket topic</Text>
          <Text style={styles.infoValue}>/topic/rider/{riderId}</Text>
          <Text style={[styles.infoTitle, { marginTop: 8 }]}>STOMP destination</Text>
          <Text style={styles.infoValue}>/app/location</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7FAFC' },
  body: { padding: 20, gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#2D3748', marginBottom: 8 },
  group: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    padding: 12,
    fontSize: 15,
    color: '#2D3748',
  },
  hint: { fontSize: 12, color: '#718096', lineHeight: 18 },
  infoCard: {
    backgroundColor: '#EBF8FF',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#3182CE',
  },
  infoTitle: { fontSize: 12, fontWeight: '600', color: '#2B6CB0' },
  infoValue: {
    fontSize: 14,
    color: '#2C5282',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
});
