import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface Member {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface MemberAvatarsProps {
  members: Member[];
  maxVisible?: number;
  size?: number;
}

export function MemberAvatars({ members, maxVisible = 5, size = 36 }: MemberAvatarsProps) {
  const visible = members.slice(0, maxVisible);
  const overflow = members.length - maxVisible;

  return (
    <View style={styles.row}>
      {visible.map((member, index) => (
        <View
          key={member.id}
          style={[styles.avatarWrapper, { marginLeft: index === 0 ? 0 : -(size * 0.3) }]}
        >
          {member.avatar_url ? (
            <Image
              source={{ uri: member.avatar_url }}
              style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                { width: size, height: size, borderRadius: size / 2 },
              ]}
            >
              <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
                {member.display_name[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.overflow,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -(size * 0.3) },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: size * 0.3 }]}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { borderWidth: 2, borderColor: '#fff', borderRadius: 99 },
  avatar: { borderRadius: 99 },
  placeholder: {
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#fff', fontWeight: '600' },
  overflow: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  overflowText: { color: '#374151', fontWeight: '600' },
});
