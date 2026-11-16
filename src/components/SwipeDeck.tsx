import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import type { Genre, MovieCard, SwipeDirection } from '@/model';
import { colors, fonts } from '@/theme';

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
const FLY_X = 560;

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
      const sign = direction === 'like' ? 1 : -1;
      translateX.value = withTiming(sign * FLY_X, { duration: 200 }, (finished) => {
        if (finished) runOnJS(commit)(direction);
      });
    },
    [commit, locked, translateX],
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
        onUpdate: (event: { translationX: number; translationY: number }) => {
          'worklet';
          if (locked.value === 1) return;
          translateX.value = event.translationX;
          translateY.value = event.translationY * 0.12;
        },
        onDeactivate: (event: {
          canceled: boolean;
          translationX: number;
          velocityX: number;
        }) => {
          'worklet';
          if (locked.value === 1) return;
          if (event.canceled) {
            settleBack();
            return;
          }
          const like =
            event.translationX > SWIPE_X ||
            (event.translationX > 40 && event.velocityX > 900);
          const nope =
            event.translationX < -SWIPE_X ||
            (event.translationX < -40 && event.velocityX < -900);
          if (like) flyOff('like');
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

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [24, 110], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-24, -110], [0, 1], Extrapolation.CLAMP),
  }));

  const washStyle = useAnimatedStyle(() => ({
    backgroundColor: translateX.value >= 0 ? colors.likeWash : colors.nopeWash,
    opacity: interpolate(Math.abs(translateX.value), [0, 140], [0, 0.85], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.front, cardStyle]}>
        <MovieCardFace movie={movie} genres={genres} />
        <Animated.View pointerEvents="none" style={[styles.wash, washStyle]} />
        <Animated.View pointerEvents="none" style={[styles.stamp, styles.likeStamp, likeStyle]}>
          <Text style={[styles.stampText, styles.likeText]}>ДА</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.stamp, styles.nopeStamp, nopeStyle]}>
          <Text style={[styles.stampText, styles.nopeText]}>НЕТ</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
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
    transform: [{ scale: 0.96 }, { translateY: 14 }],
    opacity: 0.85,
  },
  front: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  wash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 28,
  },
  stamp: {
    position: 'absolute',
    top: 28,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  likeStamp: {
    left: 22,
    borderColor: colors.accentBright,
    transform: [{ rotate: '-14deg' }],
  },
  nopeStamp: {
    right: 22,
    borderColor: colors.nope,
    transform: [{ rotate: '14deg' }],
  },
  stampText: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    letterSpacing: 2,
  },
  likeText: {
    color: colors.accentBright,
  },
  nopeText: {
    color: colors.nope,
  },
});
