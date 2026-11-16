import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
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
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bgElevated,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: '#3a1c24',
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  labelSelected: {
    color: colors.text,
  },
});
