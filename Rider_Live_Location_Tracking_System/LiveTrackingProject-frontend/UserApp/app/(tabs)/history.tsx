/**
 * app/(tabs)/history.tsx - Location update history for this session
 */
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Update History</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.emoji}>Live</Text>
        <Text style={styles.title}>Live updates log</Text>
        <Text style={styles.desc}>
          Every GPS update received from the rider over WebSocket appears
          on the Track Order tab in real time.{'\n\n'}
          In a production app you would persist these coordinates here,
          allow route replay, and show an estimated arrival time.
        </Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoRow}>WebSocket topic</Text>
          <Text style={styles.infoValue}>/topic/rider/RIDER_001</Text>
          <Text style={[styles.infoRow, { marginTop: 8 }]}>Persistence</Text>
          <Text style={styles.infoValue}>MySQL rider_location table</Text>
          <Text style={[styles.infoRow, { marginTop: 8 }]}>REST history</Text>
          <Text style={styles.infoValue}>GET /api/location/RIDER_001/last</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7FAFC' },
  header: {
    backgroundColor: '#2B6CB0',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emoji: { fontSize: 24, fontWeight: '700', color: '#2B6CB0' },
  title: { fontSize: 20, fontWeight: '700', color: '#2D3748' },
  desc: { fontSize: 14, color: '#718096', textAlign: 'center', lineHeight: 22 },
  infoCard: {
    width: '100%',
    backgroundColor: '#EBF8FF',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#3182CE',
    marginTop: 8,
  },
  infoRow: { fontSize: 12, fontWeight: '600', color: '#2B6CB0' },
  infoValue: {
    fontSize: 13,
    color: '#2C5282',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
});
