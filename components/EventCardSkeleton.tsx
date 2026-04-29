import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '@/constants/theme';

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  opacity,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  opacity: Animated.Value;
}) {
  const t = useTheme();
  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: t.surface2,
          opacity,
        },
      ]}
    />
  );
}

export function EventCardSkeleton() {
  const t = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={[styles.card, { backgroundColor: t.surface }]}>
      {/* Imagen */}
      <SkeletonBox width="100%" height={160} borderRadius={0} opacity={opacity} />

      <View style={styles.body}>
        {/* Badge + distancia */}
        <View style={styles.metaRow}>
          <SkeletonBox width={72} height={22} borderRadius={20} opacity={opacity} />
          <SkeletonBox width={48} height={14} borderRadius={6} opacity={opacity} />
        </View>
        {/* Nombre (2 líneas) */}
        <SkeletonBox width="90%" height={16} borderRadius={6} opacity={opacity} />
        <View style={{ height: 6 }} />
        <SkeletonBox width="65%" height={16} borderRadius={6} opacity={opacity} />
        {/* Venue */}
        <View style={{ height: 10 }} />
        <SkeletonBox width="55%" height={13} borderRadius={6} opacity={opacity} />
        {/* Fecha */}
        <View style={{ height: 6 }} />
        <SkeletonBox width="45%" height={13} borderRadius={6} opacity={opacity} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  body:    { padding: 14, gap: 0 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
});
