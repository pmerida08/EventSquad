import { View, Text, StyleSheet } from 'react-native';

export default function VerifyIdentityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificación de identidad</Text>
      <Text style={styles.subtitle}>Necesitamos confirmar que eres una persona real</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666' },
});
