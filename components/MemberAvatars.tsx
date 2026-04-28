import { Image } from 'expo-image';
import { View, Text, StyleSheet } from 'react-native';

type AvatarMember = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

type MemberAvatarsProps = {
  members: AvatarMember[];
  maxVisible?: number;
  size?: number;
};

export function MemberAvatars({ members, maxVisible = 5, size = 36 }: MemberAvatarsProps) {
  const visible  = members.slice(0, maxVisible);
  const overflow = members.length - visible.length;
  const overlap  = size * 0.3;

  return (
    <View style={[styles.row, { height: size }]}>
      {visible.map((m, i) => (
        <View
          key={m.id}
          style={[
            styles.avatarWrapper,
            { width: size, height: size, borderRadius: size / 2, marginLeft: i === 0 ? 0 : -overlap },
          ]}
        >
          {m.avatar_url ? (
            <Image
              source={{ uri: m.avatar_url }}
              style={{ width: size, height: size, borderRadius: size / 2 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                { width: size, height: size, borderRadius: size / 2 },
              ]}
            >
              <Text style={[styles.initial, { fontSize: size * 0.36 }]}>
                {m.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.extra,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -overlap,
            },
          ]}
        >
          <Text style={[styles.extraText, { fontSize: size * 0.3 }]}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: '#4338CA', fontWeight: '700' },
  extra: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  extraText: { color: '#6B7280', fontWeight: '700' },
});
