import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useMemo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'

import { useTheme, type Theme } from '@/constants/theme'
import type { ProposalWithVotes } from '@/lib/voting'

interface VotingCardProps {
  proposal:     ProposalWithVotes
  totalMembers: number
  hasVoted:     boolean   // true si el usuario ya votó en este grupo
  onVote:       () => void
}

export function VotingCard({ proposal, totalMembers, hasVoted, onVote }: VotingCardProps) {
  const t = useTheme()
  const s = useMemo(() => makeStyles(t), [t])

  const progress = totalMembers > 0 ? proposal.vote_count / totalMembers : 0
  const dateStr  = new Date(proposal.proposed_time).toLocaleString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  return (
    <View style={[s.card, proposal.selected && s.cardSelected]}>
      {proposal.selected && (
        <View style={s.winnerRow}>
          <FontAwesome name="trophy" size={12} color={t.primary} />
          <Text style={s.winnerText}>Punto de encuentro elegido</Text>
        </View>
      )}

      <Text style={s.location}>{proposal.location_name}</Text>

      <View style={s.timeRow}>
        <FontAwesome name="clock-o" size={13} color={t.textTertiary} />
        <Text style={s.time}>{dateStr}</Text>
      </View>

      <View style={s.progressWrapper}>
        <View style={[s.progressBar, { width: `${Math.min(1, progress) * 100}%` as any }]} />
      </View>
      <Text style={s.votes}>
        {proposal.vote_count} de {totalMembers} votos
      </Text>

      {!hasVoted && !proposal.selected && (
        <Pressable
          style={s.voteButton}
          onPress={onVote}
          accessibilityRole="button"
          accessibilityLabel={`Votar por ${proposal.location_name}`}
        >
          <FontAwesome name="check" size={14} color="#fff" />
          <Text style={s.voteButtonText}>Votar</Text>
        </Pressable>
      )}
    </View>
  )
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.surface,
      borderRadius:    14,
      padding:         16,
      marginBottom:    12,
      borderWidth:     1.5,
      borderColor:     t.border,
    },
    cardSelected: {
      borderColor:     t.primary,
      backgroundColor: t.primaryBg,
    },
    winnerRow: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            6,
      marginBottom:   10,
    },
    winnerText: {
      color:      t.primary,
      fontSize:   12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    location: {
      fontSize:   16,
      fontWeight: '700',
      color:      t.text,
      marginBottom: 6,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           6,
      marginBottom:  14,
    },
    time: {
      fontSize: 13,
      color:    t.textSecondary,
    },
    progressWrapper: {
      height:          6,
      backgroundColor: t.border,
      borderRadius:    3,
      marginBottom:    6,
      overflow:        'hidden',
    },
    progressBar: {
      height:          6,
      backgroundColor: t.primary,
      borderRadius:    3,
    },
    votes: {
      fontSize:     12,
      color:        t.textTertiary,
      marginBottom: 14,
    },
    voteButton: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            8,
      backgroundColor: t.primary,
      borderRadius:    10,
      paddingVertical: 10,
    },
    voteButtonText: {
      color:      '#fff',
      fontWeight: '700',
      fontSize:   14,
    },
  })
}
