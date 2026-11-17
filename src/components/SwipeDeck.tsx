import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { MovieCardFace } from '@/components/MovieCardFace';
import { SwipeHints } from '@/components/SwipeHints';
import type { Genre, MovieCard, SwipeDirection } from '@/model';
import { colors, radii } from '@/theme';

export type DeckHandle = {
  fling: (direction: SwipeDirection) => void;
};

type DeckProps = {
  movies: MovieCard[];
  genres: Genre[];
  onSwipe: (movie: MovieCard, direction: SwipeDirection) => void;
  onOpen: (movie: MovieCard) => void;
};

type CardHandle = {
  fling: (direction: SwipeDirection) => void;
};

type CardProps = {
  movie: MovieCard;
  genres: Genre[];
  onCommit: (direction: SwipeDirection) => void;
  onOpen: () => void;
};

const SWIPE_X = 120;
const SWIPE_Y = 100;
const FLY_X = 560;
const FLY_Y = 520;

export const SwipeDeck = forwardRef<DeckHandle, DeckProps>(function SwipeDeck(
  { movies, genres, onSwipe, onOpen },
  ref,
) {
  const top = movies[0];
  const next = movies[1];
  const cardRef = useRef<CardHandle>(null);
  const commit = useCallback(
    (direction: SwipeDirection) => {
      if (top) onSwipe(top, direction);
    },
    [onSwipe, top],
  );
  const open = useCallback(() => {
    if (top) onOpen(top);
  }, [onOpen, top]);

  useImperativeHandle(ref, () => ({
    fling(direction) {
      cardRef.current?.fling(direction);
    },
  }));

  if (!top) return null;

  return (
    <View style={styles.stage}>
      {next ? (
        <View pointerEvents="none" style={styles.behind}>
          <MovieCardFace movie={next} genres={genres} />
        </View>
      ) : null}
      <SwipeCard
        key={top.id}
        ref={cardRef}
        movie={top}
        genres={genres}
        onCommit={commit}
        onOpen={open}
      />
    </View>
  );
});

const SwipeCard = forwardRef<CardHandle, CardProps>(function SwipeCard(
  { movie, genres, onCommit, onOpen },
  ref,
) {
  'use no memo';

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const locked = useSharedValue(0);

  const commit = useCallback(
    (direction: SwipeDirection) => {
      onCommit(direction);
    },
    [onCommit],
  );

  const open = useCallback(() => {
    onOpen();
  }, [onOpen]);

  const flyOff = useCallback(
    (direction: SwipeDirection) => {
      'worklet';
      if (locked.value === 1) return;
      locked.value = 1;
      if (direction === 'seen') {
        translateY.value = withTiming(-FLY_Y, { duration: 200 }, (finished) => {
          if (finished) runOnJS(commit)(direction);
        });
        return;
      }
      if (direction === 'later') {
        translateY.value = withTiming(FLY_Y, { duration: 200 }, (finished) => {
          if (finished) runOnJS(commit)(direction);
        });
        return;
      }
      const sign = direction === 'like' ? 1 : -1;
      translateX.value = withTiming(sign * FLY_X, { duration: 200 }, (finished) => {
        if (finished) runOnJS(commit)(direction);
      });
    },
    [commit, locked, translateX, translateY],
  );

  const settleBack = useCallback(() => {
    'worklet';
    translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
  }, [translateX, translateY]);

  useImperativeHandle(
    ref,
    () => ({
      fling(direction) {
        runOnUI(flyOff)(direction);
      },
    }),
    [flyOff],
  );

  const pan = usePanGesture(
    useMemo(
      () => ({
        activeOffsetX: [-10, 10] as [number, number],
        activeOffsetY: [-12, 12] as [number, number],
        onUpdate: (event: { translationX: number; translationY: number }) => {
          'worklet';
          if (locked.value === 1) return;
          translateX.value = event.translationX;
          translateY.value = event.translationY;
        },
        onDeactivate: (event: {
          canceled: boolean;
          translationX: number;
          translationY: number;
          velocityX: number;
          velocityY: number;
        }) => {
          'worklet';
          if (locked.value === 1) return;
          if (event.canceled) {
            settleBack();
            return;
          }
          const seen =
            event.translationY < -SWIPE_Y ||
            (event.translationY < -48 && event.velocityY < -900);
          const later =
            event.translationY > SWIPE_Y ||
            (event.translationY > 48 && event.velocityY > 900);
          const like =
            event.translationX > SWIPE_X ||
            (event.translationX > 40 && event.velocityX > 900);
          const nope =
            event.translationX < -SWIPE_X ||
            (event.translationX < -40 && event.velocityX < -900);
          const vertical = Math.abs(event.translationY) >= Math.abs(event.translationX);
          if (seen && vertical) flyOff('seen');
          else if (later && vertical) flyOff('later');
          else if (like) flyOff('like');
          else if (nope) flyOff('nope');
          else settleBack();
        },
      }),
      [flyOff, locked, settleBack, translateX, translateY],
    ),
  );

  const tap = useTapGesture(
    useMemo(
      () => ({
        maxDistance: 14,
        onDeactivate: (event: { canceled: boolean }) => {
          'worklet';
          if (!event.canceled && locked.value === 0) runOnJS(open)();
        },
      }),
      [locked, open],
    ),
  );

  const gesture = useExclusiveGestures(tap, pan);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(translateX.value, [-220, 0, 220], [-8, 0, 8], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  const washStyle = useAnimatedStyle(() => {
    const tx = translateX.value;
    const ty = translateY.value;
    const up = -ty;
    const down = ty;
    if (up > down && up > Math.abs(tx) && up > 8) {
      return {
        backgroundColor: colors.seenWash,
        opacity: interpolate(up, [0, 120], [0, 0.75], Extrapolation.CLAMP),
      };
    }
    if (down > up && down > Math.abs(tx) && down > 8) {
      return {
        backgroundColor: colors.laterWash,
        opacity: interpolate(down, [0, 120], [0, 0.7], Extrapolation.CLAMP),
      };
    }
    return {
      backgroundColor: tx >= 0 ? colors.likeWash : colors.nopeWash,
      opacity: interpolate(Math.abs(tx), [0, 140], [0, 0.85], Extrapolation.CLAMP),
    };
  });

  return (
    <View style={styles.slot} collapsable={false}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.front, cardStyle]}>
          <View style={styles.cardBody} collapsable={false}>
            <MovieCardFace movie={movie} genres={genres} />
            <Animated.View pointerEvents="none" style={[styles.wash, washStyle]} />
          </View>
        </Animated.View>
      </GestureDetector>
      {/* Подсказки на слоте колоды — карточка уезжает, плашки остаются на месте */}
      <SwipeHints translateX={translateX} translateY={translateY} />
    </View>
  );
});

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  behind: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    transform: [{ scale: 0.98 }, { translateY: 8 }],
    opacity: 0.92,
  },
  slot: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  front: {
    ...StyleSheet.absoluteFill,
  },
  cardBody: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  wash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radii.card,
  },
});
