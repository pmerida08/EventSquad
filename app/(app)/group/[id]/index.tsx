import { useLocalSearchParams, Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle del grupo</Text>
      <Text style={styles.subtitle}>ID: {id}</Text>
      <Link href={`/(app)/group/${id}/chat`}>
        <Text style={styles.link}>Ir al chat</Text>
      </Link>
      <Link href={`/(app)/group/${id}/voting`}>
        <Text style={styles.link}>Votación punto de encuentro</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666' },
  link: { fontSize: 16, color: '#6366F1', textDecorationLine: 'underline' },
});
