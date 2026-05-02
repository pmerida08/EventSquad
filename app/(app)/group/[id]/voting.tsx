import FontAwesome from '@expo/vector-icons/FontAwesome'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { VotingCard } from '@/components/VotingCard'
import { useTheme, type Theme } from '@/constants/theme'

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function SpinnerCol({
  label, value, onDec, onInc, t,
}: { label: string; value: string; onDec: () => void; onInc: () => void; t: Theme }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 10, color: t.textTertiary, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>{label}</Text>
      <Pressable onPress={onInc} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Aumentar ${label}`}>
        <FontAwesome name="chevron-up" size={14} color={t.primary} />
      </Pressable>
      <Text style={{ fontSize: 20, fontWeight: '700', color: t.text, marginVertical: 8, minWidth: 44, textAlign: 'center' }}>{value}</Text>
      <Pressable onPress={onDec} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Disminuir ${label}`}>
        <FontAwesome name="chevron-down" size={14} color={t.primary} />
      </Pressable>
    </View>
  )
}
import { fetchGroupMembers } from '@/lib/groups'
import {
  fetchProposals,
  addProposal,
  voteForProposal,
  subscribeToVoting,
  parseVotingError,
  type ProposalWithVotes,
} from '@/lib/voting'
import { useLocationStore } from '@/stores/locationStore'

export default function GroupVotingScreen() {
  const t  = useTheme()
  const s  = useMemo(() => makeStyles(t), [t])
  const { id: groupId } = useLocalSearchParams<{ id: string }>()
  const coords          = useLocationStore((st) => st.coordinates)

  const [proposals,  setProposals]  = useState<ProposalWithVotes[]>([])
  const [myVoteId,   setMyVoteId]   = useState<string | null>(null)
  const [totalMembers, setTotal]    = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [votingId,   setVotingId]   = useState<string | null>(null)  // proposal en proceso de voto

  // ── Formulario "añadir propuesta" ─────────────────────────────────────────
  const [modalVisible,  setModal]      = useState(false)
  const [locName,       setLocName]    = useState('')
  const [selectedDate,  setSelDate]    = useState<Date>(new Date())
  const [pickerTarget,  setPicker]     = useState<'date' | 'time' | null>(null)
  const [submitting,    setSubmitting] = useState(false)

  const winner = proposals.find((p) => p.selected)

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!groupId) return
    try {
      const [result, members] = await Promise.all([
        fetchProposals(groupId),
        fetchGroupMembers(groupId),
      ])
      setProposals(result.proposals)
      setMyVoteId(result.myVotedProposalId)
      setTotal(members.length)
    } catch (e) {
      Alert.alert('Error', (e as Error).message)
    }
  }, [groupId])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) return
    const unsub = subscribeToVoting(groupId, () => {
      load()
    })
    return unsub
  }, [groupId, load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  // ── Votar ─────────────────────────────────────────────────────────────────
  async function handleVote(proposalId: string) {
    setVotingId(proposalId)
    try {
      await voteForProposal(proposalId)
      await load()
    } catch (e) {
      Alert.alert('No se pudo votar', parseVotingError((e as Error).message))
    } finally {
      setVotingId(null)
    }
  }

  // ── Añadir propuesta ──────────────────────────────────────────────────────
  function openModal() {
    setLocName('')
    // Fecha por defecto: mañana a las 20:00
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(20, 0, 0, 0)
    setSelDate(d)
    setPicker(null)
    setModal(true)
  }

  function adjustDate(field: 'day' | 'month' | 'year', delta: number) {
    setSelDate((prev) => {
      const d = new Date(prev)
      if (field === 'day')   d.setDate(d.getDate() + delta)
      if (field === 'month') d.setMonth(d.getMonth() + delta)
      if (field === 'year')  d.setFullYear(d.getFullYear() + delta)
      return d
    })
  }

  function adjustTime(field: 'hour' | 'minute', delta: number) {
    setSelDate((prev) => {
      const d = new Date(prev)
      if (field === 'hour') {
        d.setHours((d.getHours() + delta + 24) % 24)
      } else {
        // saltos de 5 minutos
        const rounded = Math.round(d.getMinutes() / 5) * 5
        d.setMinutes((rounded + delta * 5 + 60) % 60)
      }
      return d
    })
  }

  async function handleAddProposal() {
    const locTrimmed = locName.trim()
    if (!locTrimmed) {
      Alert.alert('Campo requerido', 'Escribe el nombre del lugar.')
      return
    }
    if (selectedDate <= new Date()) {
      Alert.alert('Fecha inválida', 'La fecha debe ser en el futuro.')
      return
    }

    const lat = coords?.latitude  ?? 40.4168
    const lng = coords?.longitude ?? -3.7038

    setSubmitting(true)
    try {
      await addProposal(groupId!, locTrimmed, lat, lng, selectedDate.toISOString())
      setModal(false)
      await load()
    } catch (e) {
      Alert.alert('Error', (e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.center} edges={['top', 'bottom']}>
        <StatusBar style={t.statusBar} />
        <ActivityIndicator size="large" color={t.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar style={t.statusBar} />

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8} accessibilityRole="button">
          <FontAwesome name="arrow-left" size={18} color={t.text} />
        </Pressable>
        <Text style={s.headerTitle}>Punto de encuentro</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner ganador */}
        {winner && (
          <View style={s.winnerBanner}>
            <FontAwesome name="map-marker" size={20} color={t.primary} />
            <View style={s.winnerBannerText}>
              <Text style={s.winnerBannerTitle}>Punto acordado</Text>
              <Text style={s.winnerBannerLoc}>{winner.location_name}</Text>
              <Text style={s.winnerBannerTime}>
                {new Date(winner.proposed_time).toLocaleString('es-ES', {
                  weekday: 'long', day: 'numeric', month: 'long',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Cabecera de la lista */}
        <View style={s.listHeader}>
          <Text style={s.sectionTitle}>
            {proposals.length === 0
              ? 'Sin propuestas todavía'
              : `${proposals.length} propuesta${proposals.length !== 1 ? 's' : ''}`}
          </Text>
          {myVoteId && (
            <View style={s.votedBadge}>
              <FontAwesome name="check" size={10} color={t.green} />
              <Text style={s.votedBadgeText}>Ya votaste</Text>
            </View>
          )}
        </View>

        {/* Lista de propuestas */}
        {proposals.length === 0 ? (
          <View style={s.emptyState}>
            <FontAwesome name="map-marker" size={36} color={t.border} />
            <Text style={s.emptyTitle}>Nadie ha propuesto nada aún</Text>
            <Text style={s.emptySub}>Sé el primero en sugerir un lugar de encuentro.</Text>
          </View>
        ) : (
          proposals.map((p) => (
            <View key={p.id} style={votingId === p.id && s.cardLoading}>
              <VotingCard
                proposal={p}
                totalMembers={totalMembers}
                hasVoted={myVoteId !== null}
                onVote={() => handleVote(p.id)}
              />
              {votingId === p.id && (
                <ActivityIndicator style={s.cardSpinner} color={t.primary} />
              )}
            </View>
          ))
        )}

        {/* Botón añadir propuesta (oculto si ya hay ganador) */}
        {!winner && (
          <Pressable style={s.addBtn} onPress={openModal} accessibilityRole="button">
            <FontAwesome name="plus" size={14} color="#fff" />
            <Text style={s.addBtnText}>Proponer lugar</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Modal: formulario nueva propuesta */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModal(false)}
      >
        {/* Overlay — sin KeyboardAvoidingView: evita el loop de layout en Android */}
        <Pressable style={s.modalOverlay} onPress={() => setModal(false)} />

        <View style={s.modalSheet}>
          <View style={s.modalHandle} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={s.modalTitle}>Nueva propuesta</Text>

            <Text style={s.inputLabel}>Lugar</Text>
            <TextInput
              style={s.input}
              placeholder="Ej: Bar El Buen Gusto, C/ Mayor 5"
              placeholderTextColor={t.textTertiary}
              value={locName}
              onChangeText={setLocName}
              maxLength={200}
              returnKeyType="done"
            />

            <Text style={s.inputLabel}>Fecha</Text>
            <Pressable
              style={[s.dateField, pickerTarget === 'date' && s.dateFieldActive]}
              onPress={() => setPicker(pickerTarget === 'date' ? null : 'date')}
              accessibilityRole="button"
            >
              <FontAwesome name="calendar" size={14} color={t.textSecondary} />
              <Text style={s.dateFieldText}>
                {selectedDate.toLocaleDateString('es-ES', {
                  weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
              <FontAwesome
                name={pickerTarget === 'date' ? 'chevron-up' : 'chevron-down'}
                size={11} color={t.textTertiary}
              />
            </Pressable>

            {pickerTarget === 'date' && (
              <View style={s.spinner}>
                <SpinnerCol
                  label="Día"
                  value={String(selectedDate.getDate())}
                  onDec={() => adjustDate('day', -1)}
                  onInc={() => adjustDate('day',  1)}
                  t={t}
                />
                <SpinnerCol
                  label="Mes"
                  value={MESES[selectedDate.getMonth()]}
                  onDec={() => adjustDate('month', -1)}
                  onInc={() => adjustDate('month',  1)}
                  t={t}
                />
                <SpinnerCol
                  label="Año"
                  value={String(selectedDate.getFullYear())}
                  onDec={() => adjustDate('year', -1)}
                  onInc={() => adjustDate('year',  1)}
                  t={t}
                />
              </View>
            )}

            <Text style={s.inputLabel}>Hora</Text>
            <Pressable
              style={[s.dateField, pickerTarget === 'time' && s.dateFieldActive]}
              onPress={() => setPicker(pickerTarget === 'time' ? null : 'time')}
              accessibilityRole="button"
            >
              <FontAwesome name="clock-o" size={14} color={t.textSecondary} />
              <Text style={s.dateFieldText}>
                {selectedDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <FontAwesome
                name={pickerTarget === 'time' ? 'chevron-up' : 'chevron-down'}
                size={11} color={t.textTertiary}
              />
            </Pressable>

            {pickerTarget === 'time' && (
              <View style={s.spinner}>
                <SpinnerCol
                  label="Hora"
                  value={String(selectedDate.getHours()).padStart(2, '0')}
                  onDec={() => adjustTime('hour', -1)}
                  onInc={() => adjustTime('hour',  1)}
                  t={t}
                />
                <SpinnerCol
                  label="Min"
                  value={String(Math.round(selectedDate.getMinutes() / 5) * 5).padStart(2, '0')}
                  onDec={() => adjustTime('minute', -1)}
                  onInc={() => adjustTime('minute',  1)}
                  t={t}
                />
              </View>
            )}

            <View style={s.modalActions}>
              <Pressable
                style={s.cancelBtn}
                onPress={() => setModal(false)}
                accessibilityRole="button"
              >
                <Text style={s.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[s.confirmBtn, submitting && s.btnDisabled]}
                onPress={handleAddProposal}
                disabled={submitting}
                accessibilityRole="button"
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.confirmBtnText}>Añadir</Text>
                }
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: t.background },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // Header
    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.borderLight },
    backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: t.text, textAlign: 'center' },

    body:        { padding: 16, paddingBottom: 40 },

    // Banner ganador
    winnerBanner:     { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: t.primaryBg, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: t.primary },
    winnerBannerText: { flex: 1 },
    winnerBannerTitle:{ fontSize: 11, fontWeight: '700', color: t.primary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
    winnerBannerLoc:  { fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 3 },
    winnerBannerTime: { fontSize: 13, color: t.textSecondary },

    // Lista
    listHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle:{ fontSize: 15, fontWeight: '700', color: t.text },
    votedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.greenBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    votedBadgeText: { fontSize: 11, color: t.green, fontWeight: '600' },

    // Estado vacío
    emptyState:  { alignItems: 'center', paddingVertical: 48, gap: 12 },
    emptyTitle:  { fontSize: 16, fontWeight: '600', color: t.textSecondary },
    emptySub:    { fontSize: 13, color: t.textTertiary, textAlign: 'center', lineHeight: 19 },

    // Card en proceso de voto
    cardLoading: { opacity: 0.7 },
    cardSpinner: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },

    // Botón añadir
    addBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: t.primary, borderRadius: 14, paddingVertical: 14, marginTop: 8 },
    addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },

    // Modal
    modalOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    modalSheet:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, maxHeight: '90%' },
    modalHandle: { width: 40, height: 4, backgroundColor: t.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle:  { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 20 },

    inputLabel:  { fontSize: 13, fontWeight: '600', color: t.textSecondary, marginBottom: 6 },
    input:       { backgroundColor: t.inputBg, borderWidth: 1, borderColor: t.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: t.text, marginBottom: 14 },
    dateField:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.inputBg, borderWidth: 1, borderColor: t.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8 },
    dateFieldActive: { borderColor: t.primary },
    dateFieldText:   { fontSize: 15, color: t.text, flex: 1 },
    spinner:         { flexDirection: 'row', backgroundColor: t.surface2, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 8, marginBottom: 14 },

    modalActions:{ flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn:   { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: t.border },
    cancelBtnText:{ fontSize: 15, fontWeight: '600', color: t.textSecondary },
    confirmBtn:  { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: t.primary },
    confirmBtnText:{ fontSize: 15, fontWeight: '700', color: '#fff' },
    btnDisabled: { opacity: 0.6 },
  })
}
