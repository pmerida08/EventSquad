import { View, Text, StyleSheet, Pressable } from 'react-native';

import type { Database } from '@/types/database.types';

type Event = Database['public']['Tables']['events']['Row'];

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.name}>{event.name}</Text>
      <Text style={styles.venue}>{event.venue}</Text>
      <Text style={styles.category}>{event.category}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  venue: { fontSize: 14, color: '#666', marginBottom: 4 },
  category: { fontSize: 12, color: '#6366F1', fontWeight: '500', textTransform: 'uppercase' },
});
