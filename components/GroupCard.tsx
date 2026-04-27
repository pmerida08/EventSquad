import { View, Text, StyleSheet, Pressable } from 'react-native';

interface GroupCardProps {
  name: string;
  description: string | null;
  memberCount: number;
  maxMembers: number;
  onPress: () => void;
}

export function GroupCard({ name, description, memberCount, maxMembers, onPress }: GroupCardProps) {
  const isFull = memberCount >= maxMembers;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={[styles.badge, isFull && styles.badgeFull]}>
          {memberCount}/{maxMembers}
        </Text>
      </View>
      {description ? <Text style={styles.description} numberOfLines={2}>{description}</Text> : null}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '600', flex: 1 },
  badge: {
    backgroundColor: '#EEF2FF',
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeFull: { backgroundColor: '#FEE2E2', color: '#EF4444' },
  description: { fontSize: 14, color: '#666' },
});
