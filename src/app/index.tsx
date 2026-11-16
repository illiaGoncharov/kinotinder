import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Attribution } from '@/components/Attribution';
import { FilterSheet } from '@/components/FilterSheet';
import { Frame, Message } from '@/components/Frame';
import { SwipeDeck, type DeckHandle } from '@/components/SwipeDeck';
import { useDeck } from '@/hooks/useDeck';
import { filtersAreDefault } from '@/lib/filters';
import type { MovieCard, SwipeDirection } from '@/model';
import { useFiltersStore } from '@/store/filters';
import { useSwipesStore } from '@/store/swipes';
import { colors, fonts } from '@/theme';

export default function DeckScreen() {
  const deckRef = useRef<DeckHandle>(null);
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
          <Pressable onPress={() => router.push('/evening')} hitSlop={8}>
            <Text style={styles.headerButton}>На вечер {likeCount > 0 ? likeCount : ''}</Text>
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
            <SwipeDeck
              ref={deckRef}
              movies={movies}
              genres={genres}
              onSwipe={onSwipe}
              onOpen={openMovie}
            />
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.action, styles.nope, !ready && styles.disabled]}
            disabled={!ready}
            onPress={() => deckRef.current?.fling('nope')}
            accessibilityLabel="Не нравится">
            <Text style={styles.nopeText}>нет</Text>
          </Pressable>
          <Pressable
            style={[styles.action, styles.like, !ready && styles.disabled]}
            disabled={!ready}
            onPress={() => deckRef.current?.fling('like')}
            accessibilityLabel="Нравится">
            <Text style={styles.likeText}>да</Text>
          </Pressable>
        </View>
        {hasMoreError ? (
          <Pressable onPress={retry}>
            <Text style={styles.moreError}>Дальше не загрузилось. Нажми, чтобы повторить.</Text>
          </Pressable>
        ) : null}
        <Attribution />
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
    paddingHorizontal: 18,
    paddingBottom: 8,
    minHeight: 42,
  },
  brand: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 18,
    flexShrink: 1,
  },
  headerButton: {
    color: colors.textMuted,
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
  },
  headerActive: {
    color: colors.accentBright,
  },
  deck: {
    flex: 1,
  },
  center: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 8,
  },
  action: {
    minWidth: 108,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  nope: {
    borderColor: colors.nope,
    backgroundColor: '#171b24',
  },
  like: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  disabled: {
    opacity: 0.35,
  },
  nopeText: {
    color: colors.nope,
    fontFamily: fonts.sansBold,
    fontSize: 16,
  },
  likeText: {
    color: colors.text,
    fontFamily: fonts.sansBold,
    fontSize: 16,
  },
  retry: {
    alignSelf: 'center',
    marginBottom: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.accentBright,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
  },
  moreError: {
    textAlign: 'center',
    color: colors.accentBright,
    fontFamily: fonts.sans,
    fontSize: 13,
    paddingHorizontal: 20,
  },
});
