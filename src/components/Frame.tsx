import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { colors, fonts } from '@/theme';

export function Frame({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.frame, style]} {...rest}>
      {children}
    </View>
  );
}

type MessageProps = {
  title: string;
  body?: string;
};

export function Message({ title, body }: MessageProps) {
  return (
    <View style={styles.message}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: colors.bg,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 34,
  },
  body: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
});
