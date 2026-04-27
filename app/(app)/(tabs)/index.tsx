import { View, Text, StyleSheet } from 'react-native';

export default function EventsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eventos cerca de ti</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600' },
});
