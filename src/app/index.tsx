import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterSheet } from '@/components/FilterSheet';
import { Frame, Message } from '@/components/Frame';
import { SwipeDeck } from '@/components/SwipeDeck';
import { useDeck } from '@/hooks/useDeck';
import { filtersAreDefault } from '@/lib/filters';
import type { MovieCard, SwipeDirection } from '@/model';
import { useFiltersStore } from '@/store/filters';
import { useSwipesStore } from '@/store/swipes';
import { colors, fonts, radii } from '@/theme';

export default function DeckScreen() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { movies, genres, status, hasMoreError, retry } = useDeck();
  const filters = useFiltersStore((state) => state.filters);
  const swipe = useSwipesStore((state) => state.swipe);
  const likeCount = useSwipesStore(
    (state) => state.swipes.filter((item) => item.direction === 'like').length,
  );
  const ready = status === 'ready';

  const onSwipe = useCallback(
    (movie: MovieCard, direction: SwipeDirection) => {
      swipe(movie, direction);
    },
    [swipe],
  );

  const openMovie = useCallback((movie: MovieCard) => {
    router.push({ pathname: '/movie/[id]', params: { id: String(movie.id) } });
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Frame>
        <View style={styles.header}>
          <Pressable onPress={() => setFiltersOpen(true)} hitSlop={8}>
            <Text style={[styles.headerButton, !filtersAreDefault(filters) && styles.headerActive]}>
              Фильтры
            </Text>
          </Pressable>
          <Text style={styles.brand} numberOfLines={1}>
            Кинотиндер
          </Text>
          <Pressable onPress={() => router.push('/evening')} hitSlop={8} style={styles.headerRight}>
            <Text style={styles.headerButton}>Вечер</Text>
            {likeCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{likeCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.deck}>
          {status === 'needs-key' ? (
            <Message
              title="Нужен ключ TMDB"
              body="Заведи бесплатный ключ на themoviedb.org, положи его в файл .env как EXPO_PUBLIC_TMDB_API_KEY и перезапусти приложение."
            />
          ) : null}
          {status === 'loading' ? <Message title="Собираем колоду" /> : null}
          {status === 'error' ? (
            <View style={styles.center}>
              <Message
                title="Не вышло загрузить"
                body="Проверь сеть и ключ. Если ключ новый, перезапуск тоже нужен."
              />
              <Pressable style={styles.retry} onPress={retry}>
                <Text style={styles.retryText}>Ещё раз</Text>
              </Pressable>
            </View>
          ) : null}
          {status === 'empty' ? (
            <View style={styles.center}>
              <Message
                title="Под эти фильтры пусто"
                body="Ослабь год, оценку или жанр. Уже отмеченные фильмы в колоду не возвращаются."
              />
              <Pressable style={styles.retry} onPress={() => setFiltersOpen(true)}>
                <Text style={styles.retryText}>Открыть фильтры</Text>
              </Pressable>
            </View>
          ) : null}
          {ready ? (
            <SwipeDeck movies={movies} genres={genres} onSwipe={onSwipe} onOpen={openMovie} />
          ) : null}
        </View>

        {ready ? (
          <View style={styles.gestureLegend} pointerEvents="none">
            <Text style={styles.legendMuted}>свайп:</Text>
            <Text style={styles.legendItem}>👎 нет</Text>
            <Text style={styles.legendDot}>·</Text>
            <Text style={styles.legendItem}>📌 потом</Text>
            <Text style={styles.legendDot}>·</Text>
            <Text style={styles.legendItem}>❤️ да</Text>
            <Text style={styles.legendDot}>·</Text>
            <Text style={styles.legendItem}>👀 вверх</Text>
          </View>
        ) : null}

        {hasMoreError ? (
          <Pressable onPress={retry}>
            <Text style={styles.moreError}>Дальше не загрузилось. Нажми, чтобы повторить.</Text>
          </Pressable>
        ) : null}
      </Frame>
      <FilterSheet visible={filtersOpen} genres={genres} onClose={() => setFiltersOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    minHeight: 44,
  },
  brand: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    flexShrink: 1,
    letterSpacing: 0.15,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerButton: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  headerActive: {
    color: colors.link,
    fontFamily: fonts.sansMedium,
  },
  badge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
  },
  badgeText: {
    color: colors.textMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  deck: {
    flex: 1,
  },
  gestureLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  legendMuted: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  legendItem: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  legendDot: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  center: {
    flex: 1,
  },
  retry: {
    alignSelf: 'center',
    marginBottom: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.link,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  moreError: {
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
    paddingHorizontal: 20,
  },
});
