import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <Link href="/(auth)/login">
        <Text>¿Ya tienes cuenta? Inicia sesión</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
});
