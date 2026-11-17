import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SwipeDirection } from '@/model';
import { colors, fonts, radii } from '@/theme';

type Props = {
  disabled: boolean;
  onPress: (direction: SwipeDirection) => void;
};

function ActionColumn({
  disabled,
  onPress,
  label,
  accessibilityLabel,
  children,
}: {
  disabled: boolean;
  onPress: () => void;
  label: string;
  accessibilityLabel: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.col}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.hit,
          pressed && !disabled && styles.hitPressed,
          disabled && styles.hitDisabled,
        ]}>
        {children}
      </Pressable>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

export function DeckActions({ disabled, onPress }: Props) {
  return (
    <View style={styles.bar}>
      <ActionColumn
        disabled={disabled}
        onPress={() => onPress('nope')}
        label="нет"
        accessibilityLabel="Не нравится">
        <View style={[styles.circle, styles.circleNope]}>
          <Text style={styles.glyphNope}>×</Text>
        </View>
      </ActionColumn>

      <ActionColumn
        disabled={disabled}
        onPress={() => onPress('seen')}
        label="вверх"
        accessibilityLabel="Уже видел">
        <View style={styles.seenPill}>
          <Text style={styles.seenLabel}>видел</Text>
        </View>
      </ActionColumn>

      <ActionColumn
        disabled={disabled}
        onPress={() => onPress('like')}
        label="да"
        accessibilityLabel="Нравится">
        <View style={[styles.circle, styles.circleLike]}>
          <Text style={styles.glyphLike}>♥</Text>
        </View>
      </ActionColumn>
    </View>
  );
}

const CIRCLE = 58;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 6,
    paddingHorizontal: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  hit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  hitDisabled: {
    opacity: 0.32,
  },
  caption: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  circleNope: {
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
  },
  circleLike: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  glyphNope: {
    color: colors.textMuted,
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
    fontWeight: '300',
  },
  glyphLike: {
    color: colors.accentBright,
    fontSize: 22,
    lineHeight: 24,
    marginTop: 2,
  },
  seenPill: {
    minWidth: 64,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seenLabel: {
    color: colors.link,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
});