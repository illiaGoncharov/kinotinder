import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radii } from '@/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.bg,
  },
  selected: {
    borderColor: colors.link,
    backgroundColor: 'rgba(88, 166, 255, 0.08)',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  labelSelected: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
  },
});