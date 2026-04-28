import { View, Text, StyleSheet, Pressable } from 'react-native';

import type { GroupWithCount } from '@/lib/groups';

type GroupCardProps = {
  group: GroupWithCount;
  myGroupId?: string | null;
  onPress: () => void;
};

export function GroupCard({ group, myGroupId, onPress }: GroupCardProps) {
  const isMine = myGroupId === group.id;
  const count  = group.member_count ?? 0;
  const max    = group.max_members ?? 10;
  const isFull = count >= max;
  const pct    = Math.min(1, count / max);

  return (
    <Pressable
      style={[styles.card, isMine && styles.cardMine]}
      onPress={onPress}
      android_ripple={{ color: '#E0E7FF' }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isMine && (
            <View style={styles.mineBadge}>
              <Text style={styles.mineBadgeText}>Tu grupo</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
        </View>
        <View style={[styles.statusBadge, isFull ? styles.statusFull : styles.statusOpen]}>
          <Text style={[styles.statusText, isFull ? styles.statusTextFull : styles.statusTextOpen]}>
            {isFull ? 'Completo' : 'Abierto'}
          </Text>
        </View>
      </View>

      {/* Descripción */}
      {group.description ? (
        <Text style={styles.description} numberOfLines={2}>{group.description}</Text>
      ) : null}

      {/* Contador + barra de progreso */}
      <View style={styles.footer}>
        <Text style={styles.countText}>{count} / {max} miembros</Text>
      </View>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${pct * 100}%` as any },
            isFull && styles.barFull,
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardMine: {
    borderColor: '#6366F1',
    backgroundColor: '#F5F3FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  headerLeft: { flex: 1, gap: 4 },
  mineBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  mineBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusOpen: { backgroundColor: '#D1FAE5' },
  statusFull: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextOpen: { color: '#065F46' },
  statusTextFull: { color: '#991B1B' },
  description: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6, marginTop: 4 },
  countText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  barBg: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 4, backgroundColor: '#6366F1', borderRadius: 4 },
  barFull: { backgroundColor: '#EF4444' },
});
