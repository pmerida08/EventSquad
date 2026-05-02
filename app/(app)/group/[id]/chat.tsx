import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme, type Theme } from '@/constants/theme'
import {
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  subscribeToTyping,
  type MessageWithProfile,
} from '@/lib/messages'
import { reportUser, parseModerationError } from '@/lib/moderation'
import { useAuthStore } from '@/stores/authStore'

const REPORT_REASONS = [
  'Comportamiento inapropiado',
  'Spam o publicidad',
  'Acoso o insultos',
  'Otro',
]

// ── Burbuja de mensaje ────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMe,
  showAvatar,
  t,
  onLongPress,
}: {
  msg: MessageWithProfile
  isMe: boolean
  showAvatar: boolean
  t: Theme
  onLongPress?: () => void
}) {
  const s = useMemo(() => makeBubbleStyles(t), [t])
  const time = new Date(msg.created_at).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <View style={[s.row, isMe && s.rowMe]}>
      {/* Avatar — solo para mensajes de otros, y solo en el último de su bloque */}
      {!isMe && (
        <View style={s.avatarSlot}>
          {showAvatar ? (
            msg.profiles.avatar_url ? (
              <Image source={{ uri: msg.profiles.avatar_url }} style={s.avatar} contentFit="cover" />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarInitial}>
                  {msg.profiles.display_name[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )
          ) : null}
        </View>
      )}

      <Pressable
        style={s.bubbleWrapper}
        onLongPress={onLongPress}
        delayLongPress={400}
        disabled={!onLongPress}
        accessibilityRole="button"
        accessibilityLabel={onLongPress ? `Mensaje de ${msg.profiles.display_name}. Mantén pulsado para reportar` : undefined}
      >
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
          {!isMe && showAvatar && (
            <Text style={s.senderName}>{msg.profiles.display_name}</Text>
          )}
          <Text style={[s.content, isMe && s.contentMe]}>{msg.content}</Text>
          <Text style={[s.time, isMe && s.timeMe]}>{time}</Text>
        </View>
      </Pressable>
    </View>
  )
}

function makeBubbleStyles(t: Theme) {
  return StyleSheet.create({
    row:            { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2, paddingHorizontal: 12 },
    rowMe:          { flexDirection: 'row-reverse' },
    avatarSlot:     { width: 32, marginRight: 6 },
    avatar:         { width: 32, height: 32, borderRadius: 16 },
    avatarFallback: { backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' },
    avatarInitial:  { color: '#fff', fontSize: 13, fontWeight: '700' },
    bubbleWrapper:  { maxWidth: '80%' },
    bubble:         { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, paddingBottom: 6 },
    bubbleThem:     { backgroundColor: t.surface, borderBottomLeftRadius: 4 },
    bubbleMe:       { backgroundColor: t.primary, borderBottomRightRadius: 4 },
    senderName:     { fontSize: 11, fontWeight: '700', color: t.textTertiary, marginBottom: 2 },
    content:        { fontSize: 15, color: t.text, lineHeight: 21 },
    contentMe:      { color: '#fff' },
    time:           { fontSize: 10, color: t.textTertiary, marginTop: 3, alignSelf: 'flex-end' },
    timeMe:         { color: 'rgba(255,255,255,0.65)' },
  })
}

// ── Pantalla principal ────────────────────────────────────────────────────────

export default function GroupChatScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>()
  const t  = useTheme()
  const s  = useMemo(() => makeStyles(t), [t])

  const profile = useAuthStore((st) => st.profile)
  const user    = useAuthStore((st) => st.user)

  const [messages, setMessages]     = useState<MessageWithProfile[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadMore]  = useState(false)
  const [hasMore, setHasMore]       = useState(true)
  const [text, setText]             = useState('')
  const [sending, setSending]       = useState(false)
  const [typingNames, setTyping]    = useState<string[]>([])

  const flatRef     = useRef<FlatList>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingCtrl  = useRef<ReturnType<typeof subscribeToTyping> | null>(null)

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    let unsub: (() => void) | undefined

    async function init() {
      try {
        const data = await fetchMessages(groupId)
        setMessages(data)
        setHasMore(data.length === 40)
      } finally {
        setLoading(false)
      }

      // Realtime: nuevos mensajes
      unsub = subscribeToMessages(groupId, (msg) => {
        // Evitar duplicados si el mensaje es nuestro (ya insertado optimistamente)
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev],
        )
      })

      // Presence: typing indicator
      if (user && profile) {
        typingCtrl.current = subscribeToTyping(groupId, user.id, setTyping)
      }
    }

    init()
    return () => {
      unsub?.()
      typingCtrl.current?.unsubscribe()
    }
  }, [groupId, user, profile])

  // ── Paginación: cargar mensajes anteriores ─────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadMore(true)
    try {
      const oldest = messages[messages.length - 1].created_at
      const older  = await fetchMessages(groupId, oldest)
      if (older.length === 0) { setHasMore(false); return }
      setMessages((prev) => [...prev, ...older])
      setHasMore(older.length === 40)
    } finally {
      setLoadMore(false)
    }
  }, [loadingMore, hasMore, messages, groupId])

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const content = text.trim()
    if (!content || sending || !user || !profile) return

    // Parar typing indicator
    typingCtrl.current?.stopTyping()
    if (typingTimer.current) clearTimeout(typingTimer.current)

    setText('')
    setSending(true)

    // Inserción optimista
    const optimistic: MessageWithProfile = {
      id:         `optimistic-${Date.now()}`,
      group_id:   groupId,
      user_id:    user.id,
      content,
      created_at: new Date().toISOString(),
      profiles:   { display_name: profile.display_name, avatar_url: profile.avatar_url },
    }
    setMessages((prev) => [optimistic, ...prev])

    try {
      const saved = await sendMessage(groupId, content)
      // Reemplazar el optimista con el real
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...saved, profiles: optimistic.profiles } : m)),
      )
    } catch {
      // Revertir si falla
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setText(content)
    } finally {
      setSending(false)
    }
  }, [text, sending, groupId, user, profile])

  // ── Reportar mensaje ──────────────────────────────────────────────────────
  const handleReportMessage = useCallback((msg: MessageWithProfile) => {
    Alert.alert(
      'Reportar mensaje',
      `Selecciona el motivo del reporte contra ${msg.profiles.display_name}`,
      [
        ...REPORT_REASONS.map((reason) => ({
          text: reason,
          onPress: async () => {
            try {
              await reportUser(groupId, msg.user_id, reason);
              Alert.alert('Reporte enviado', 'Tu reporte ha sido registrado.');
            } catch (e) {
              Alert.alert('Error', parseModerationError((e as Error).message));
            }
          },
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  }, [groupId])

  // ── Typing indicator ───────────────────────────────────────────────────────
  const handleTextChange = useCallback((val: string) => {
    setText(val)
    if (!typingCtrl.current || !profile) return

    typingCtrl.current.startTyping(profile.display_name)

    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      typingCtrl.current?.stopTyping()
    }, 2500)
  }, [profile])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar style={t.statusBar} />

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <FontAwesome name="arrow-left" size={16} color={t.text} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>Chat del grupo</Text>
          <Text style={s.headerSub} numberOfLines={1}>
            {typingNames.length > 0
              ? `${typingNames.join(', ')} ${typingNames.length === 1 ? 'está' : 'están'} escribiendo…`
              : 'Mensajes del grupo'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            inverted
            contentContainerStyle={s.listContent}
            renderItem={({ item, index }) => {
              const isMe      = item.user_id === user?.id
              const next      = messages[index - 1]  // anterior en la lista (más nuevo, inverted)
              const showAvatar = !isMe && (!next || next.user_id !== item.user_id)
              return (
                <MessageBubble
                  key={item.id}
                  msg={item}
                  isMe={isMe}
                  showAvatar={showAvatar}
                  t={t}
                  onLongPress={!isMe ? () => handleReportMessage(item) : undefined}
                />
              )
            }}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <FontAwesome name="comments-o" size={48} color={t.textTertiary} />
                <Text style={s.emptyTitle}>Sin mensajes todavía</Text>
                <Text style={s.emptySub}>¡Sé el primero en escribir!</Text>
              </View>
            }
            ListFooterComponent={
              loadingMore
                ? <ActivityIndicator size="small" color={t.primary} style={{ margin: 12 }} />
                : null
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
          />

          {/* Barra de composición */}
          <View style={s.composer}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={handleTextChange}
              placeholder="Escribe un mensaje…"
              placeholderTextColor={t.textTertiary}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
            <Pressable
              style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <FontAwesome name="send" size={15} color="#fff" />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: t.background },
    header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border, backgroundColor: t.surface },
    backBtn:     { marginRight: 12 },
    headerCenter:{ flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: t.text },
    headerSub:   { fontSize: 12, color: t.textTertiary, marginTop: 1 },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { paddingTop: 12, paddingBottom: 8 },
    emptyWrap:   { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
    emptyTitle:  { fontSize: 18, fontWeight: '700', color: t.text },
    emptySub:    { fontSize: 14, color: t.textSecondary },
    composer:    {
      flexDirection: 'row', alignItems: 'flex-end',
      paddingHorizontal: 12, paddingVertical: 10,
      borderTopWidth: 1, borderTopColor: t.border,
      backgroundColor: t.surface, gap: 10,
    },
    input:       {
      flex: 1, backgroundColor: t.surface2, borderRadius: 22,
      paddingHorizontal: 16, paddingVertical: 10,
      fontSize: 15, color: t.text, maxHeight: 120,
      borderWidth: 1, borderColor: t.border,
    },
    sendBtn:     {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: t.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { backgroundColor: t.textTertiary },
  })
}
