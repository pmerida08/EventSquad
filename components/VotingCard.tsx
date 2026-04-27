import { View, Text, StyleSheet, Pressable } from 'react-native';

import type { Database } from '@/types/database.types';

type Proposal = Database['public']['Views']['meetup_proposals_with_votes']['Row'];

interface VotingCardProps {
  proposal: Proposal;
  totalMembers: number;
  hasVoted: boolean;
  onVote: () => void;
}

export function VotingCard({ proposal, totalMembers, hasVoted, onVote }: VotingCardProps) {
  const progress = totalMembers > 0 ? proposal.vote_count / totalMembers : 0;

  return (
    <View style={[styles.card, proposal.selected && styles.cardSelected]}>
      {proposal.selected && <Text style={styles.winner}>Ganador ✓</Text>}
      <Text style={styles.location}>{proposal.location_name}</Text>
      <Text style={styles.time}>{new Date(proposal.proposed_time).toLocaleString('es-ES')}</Text>

      <View style={styles.progressWrapper}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.votes}>
        {proposal.vote_count} de {totalMembers} votos
      </Text>

      {!hasVoted && !proposal.selected && (
        <Pressable style={styles.voteButton} onPress={onVote}>
          <Text style={styles.voteButtonText}>Votar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardSelected: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  winner: { color: '#6366F1', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  location: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  time: { fontSize: 14, color: '#666', marginBottom: 12 },
  progressWrapper: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: '#6366F1', borderRadius: 3 },
  votes: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  voteButton: { backgroundColor: '#6366F1', borderRadius: 8, padding: 10, alignItems: 'center' },
  voteButtonText: { color: '#fff', fontWeight: '600' },
});
