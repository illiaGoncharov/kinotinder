import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';

import { posterUrl } from '@/lib/format';
import { colors, fonts, radii } from '@/theme';

type Props = {
  path: string | null;
  size?: 'w185' | 'w342' | 'w500' | 'w780';
  style?: StyleProp<ImageStyle>;
  label?: string;
};

export function Poster({ path, size = 'w500', style, label }: Props) {
  const uri = posterUrl(path, size);
  if (!uri) {
    const letter = label?.trim().charAt(0).toUpperCase();
    return (
      <View style={[styles.fallback, style]}>
        {letter ? <Text style={styles.letter}>{letter}</Text> : null}
      </View>
    );
  }

  return <Image source={{ uri }} style={style} contentFit="cover" />;
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.posterFallback,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  letter: {
    color: colors.textFaint,
    fontFamily: fonts.sansMedium,
    fontSize: 20,
  },
});