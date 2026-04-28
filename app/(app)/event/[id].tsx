import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// react-native-maps requiere un development build (no funciona en Expo Go).
// Se sustituye por un botón que abre Google Maps externamente.

import { fetchEventById, formatEventDate, formatDistance } from '@/lib/events';
import type { EventRow } from '@/lib/events';
import { useLocationStore } from '@/stores/locationStore';

const CATEGORY_COLORS: Record<string, string> = {
  concierto:     '#6366F1',
  festival:      '#F59E0B',
  'electrónica': '#EC4899',
  flamenco:      '#EF4444',
  fiesta:        '#10B981',
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const coordinates = useLocationStore((s) => s.coordinates);

  const [event, setEvent]     = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchEventById(id)
      .then(setEvent)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Evento no encontrado'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const color = CATEGORY_COLORS[event.category] ?? '#6366F1';
  const distance = coordinates
    ? haversineKm(coordinates.latitude, coordinates.longitude, event.lat, event.lng)
    : null;

  function openMaps() {
    const url = `https://maps.google.com/?q=${event!.lat},${event!.lng}`;
    Linking.openURL(url);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView bounces showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.hero} contentFit="cover" />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: color + '22' }]}>
            <Text style={styles.heroEmoji}>🎵</Text>
          </View>
        )}

        {/* Back button flotante */}
        <Pressable style={styles.floatingBack} onPress={() => router.back()}>
          <Text style={styles.floatingBackText}>←</Text>
        </Pressable>

        <View style={styles.body}>
          {/* Categoría + distancia */}
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: color + '18' }]}>
              <Text style={[styles.categoryText, { color }]}>{event.category.toUpperCase()}</Text>
            </View>
            {distance !== null && (
              <Text style={styles.distanceText}>📍 {formatDistance(distance)}</Text>
            )}
          </View>

          {/* Nombre */}
          <Text style={styles.name}>{event.name}</Text>

          {/* Info cards */}
          <View style={styles.infoCard}>
            <InfoRow icon="🗓" label="Fecha" value={formatEventDate(event.date)} />
            <Divider />
            <InfoRow icon="🏟" label="Recinto" value={event.venue} />
            <Divider />
            <InfoRow icon="📍" label="Dirección" value={event.address} />
          </View>

          {/* Ubicación — botón abre Google Maps externamente */}
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <Pressable onPress={openMaps} style={[styles.mapsBtn, { borderColor: color }]}>
            <View style={[styles.mapsBtnIcon, { backgroundColor: color + '18' }]}>
              <Text style={styles.mapsBtnEmoji}>🗺️</Text>
            </View>
            <View style={styles.mapsBtnContent}>
              <Text style={styles.mapsBtnTitle}>Ver en Google Maps</Text>
              <Text style={styles.mapsBtnSub}>{event.address}</Text>
            </View>
            <Text style={[styles.mapsBtnArrow, { color }]}>→</Text>
          </Pressable>

          {/* CTA grupos — Fase 3 */}
          <View style={styles.groupsCard}>
            <Text style={styles.groupsTitle}>👥 Grupos para este evento</Text>
            <Text style={styles.groupsSub}>
              Encuentra compañeros que también vayan a este evento.
            </Text>
            <Pressable
              style={[styles.groupsBtn, { backgroundColor: color }]}
              onPress={() => router.push(`/(app)/group/${event.id}/index` as never)}
            >
              <Text style={styles.groupsBtnText}>Ver grupos →</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F9FAFB' },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hero:            { width: '100%', height: 260 },
  heroPlaceholder: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },
  heroEmoji:       { fontSize: 64 },
  floatingBack: {
    position: 'absolute', top: 16, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  floatingBackText: { color: '#fff', fontSize: 20, lineHeight: 22 },
  body:            { padding: 20 },
  metaRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  categoryBadge:   { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  categoryText:    { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  distanceText:    { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  name:            { fontSize: 26, fontWeight: '800', color: '#111827', lineHeight: 33, marginBottom: 20 },
  infoCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 4, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.06, shadowRadius: 6 },
  infoRow:         { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  infoIcon:        { fontSize: 20, marginRight: 12, marginTop: 1 },
  infoContent:     { flex: 1 },
  infoLabel:       { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 },
  infoValue:       { fontSize: 15, color: '#111827', fontWeight: '500' },
  divider:         { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 14 },
  sectionTitle:    { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  mapsBtn:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 24, gap: 12 },
  mapsBtnIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mapsBtnEmoji:    { fontSize: 22 },
  mapsBtnContent:  { flex: 1 },
  mapsBtnTitle:    { fontSize: 15, fontWeight: '600', color: '#111827' },
  mapsBtnSub:      { fontSize: 12, color: '#6B7280', marginTop: 2 },
  mapsBtnArrow:    { fontSize: 18, fontWeight: '700' },
  groupsCard:      { backgroundColor: '#EEF2FF', borderRadius: 16, padding: 20, marginBottom: 32 },
  groupsTitle:     { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  groupsSub:       { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 16 },
  groupsBtn:       { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  groupsBtnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorText:       { color: '#EF4444', marginBottom: 16, textAlign: 'center' },
  backBtn:         { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#6366F1', borderRadius: 10 },
  backBtnText:     { color: '#fff', fontWeight: '600' },
});
