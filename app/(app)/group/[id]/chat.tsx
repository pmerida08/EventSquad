import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat del grupo</Text>
      <Text style={styles.subtitle}>Grupo: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666' },
});
