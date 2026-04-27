import { View, Text, StyleSheet } from 'react-native';

export default function GroupsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis grupos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600' },
});
