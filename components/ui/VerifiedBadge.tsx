import { View, Text, StyleSheet } from 'react-native';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { fontSize: 10, paddingH: 6, paddingV: 2, iconSize: 10 },
  md: { fontSize: 12, paddingH: 8, paddingV: 3, iconSize: 12 },
  lg: { fontSize: 14, paddingH: 10, paddingV: 4, iconSize: 14 },
};

export function VerifiedBadge({ size = 'md' }: VerifiedBadgeProps) {
  const s = SIZE_MAP[size];
  return (
    <View
      style={[
        styles.badge,
        { paddingHorizontal: s.paddingH, paddingVertical: s.paddingV },
      ]}
    >
      <Text style={[styles.icon, { fontSize: s.iconSize }]}>✓</Text>
      <Text style={[styles.text, { fontSize: s.fontSize }]}>Verificado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  icon: { color: '#059669', fontWeight: '700' },
  text: { color: '#059669', fontWeight: '600' },
});
