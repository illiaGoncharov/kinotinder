import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

export function Attribution() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Постеры и сведения о фильмах — TMDB</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
    paddingBottom: 2,
    alignItems: 'center',
  },
  text: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
