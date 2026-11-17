import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import type { SwipeDirection } from '@/model';
import { colors, fonts, radii } from '@/theme';

/** Порог появления — с первых сантиметров жеста, не у края экрана */
const HINT_ON = 4;

function hintStrength(value: number): number {
  'worklet';
  if (value < HINT_ON) return 0;
  return interpolate(value, [HINT_ON, 22, 56], [0.35, 0.85, 1], Extrapolation.CLAMP);
}

function pickGesture(tx: number, ty: number): SwipeDirection | null {
  'worklet';
  const up = -ty;
  const down = ty;
  const side = Math.abs(tx);
  if (up >= HINT_ON && up >= side) return 'seen';
  if (down >= HINT_ON && down >= side) return 'later';
  if (tx >= HINT_ON && side >= up && side >= down) return 'like';
  if (tx <= -HINT_ON && side >= up && side >= down) return 'nope';
  return null;
}

type BadgeProps = {
  direction: SwipeDirection;
  emoji: string;
  label: string;
  labelTint?: string;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

function HintBadge({ direction, emoji, label, labelTint, translateX, translateY }: BadgeProps) {
  const animStyle = useAnimatedStyle(() => {
    const tx = translateX.value;
    const ty = translateY.value;
    const active = pickGesture(tx, ty) === direction;
    let driver = 0;
    if (active) {
      if (direction === 'like') driver = tx;
      else if (direction === 'nope') driver = -tx;
      else if (direction === 'seen') driver = -ty;
      else driver = ty;
    }
    const strength = active ? hintStrength(driver) : 0;
    const scale = interpolate(strength, [0, 1], [0.88, 1]);
    return { opacity: strength, transform: [{ scale }] };
  });

  return (
    <Animated.View style={[styles.badge, animStyle]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, labelTint ? { color: labelTint } : null]}>{label}</Text>
    </Animated.View>
  );
}

type Props = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

export function SwipeHints({ translateX, translateY }: Props) {
  const shared = { translateX, translateY };

  return (
    <Animated.View pointerEvents="none" style={styles.layer}>
      <View style={styles.topSlot}>
        <HintBadge direction="seen" emoji="👀" label="видел" labelTint={colors.link} {...shared} />
      </View>
      <View style={styles.bottomRow}>
        <HintBadge direction="nope" emoji="👎" label="нет" {...shared} />
        <HintBadge direction="later" emoji="📌" label="потом" labelTint="#d2a8ff" {...shared} />
        <HintBadge direction="like" emoji="❤️" label="да" labelTint={colors.accentBright} {...shared} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    elevation: 20,
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  topSlot: {
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(13, 17, 23, 0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.1,
  },
});