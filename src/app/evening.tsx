import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Frame, Message } from '@/components/Frame';
import { Poster } from '@/components/Poster';
import { filmsCount, formatVote, releaseYear } from '@/lib/format';
import type { MovieCard } from '@/model';
import { useSwipesStore } from '@/store/swipes';
import { colors, fonts } from '@/theme';

export default function EveningScreen() {
  const insets = useSafeAreaInsets();
  const swipes = useSwipesStore((state) => state.swipes);
  const cards = useSwipesStore((state) => state.cards);
  const removeFromEvening = useSwipesStore((state) => state.removeFromEvening);

  const movies = swipes.flatMap((swipe) => {
    if (swipe.direction !== 'like') return [];
    const card = cards[swipe.movieId];
    return card ? [card] : [];
  });

  return (
    <Frame>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>Назад</Text>
        </Pressable>
        <Text style={styles.title}>На вечер</Text>
        <Text style={styles.count}>{filmsCount(movies.length)}</Text>
      </View>

      {movies.length === 0 ? (
        <Message
          title="Пока пусто"
          body="Свайпни вправо то, что хочется посмотреть. Здесь останется порядок, в котором ты сказал «да»."
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}>
          <Text style={styles.note}>В том порядке, как ты их отметил. Оценку рядом не используем для сортировки.</Text>
          {movies.map((movie) => (
            <EveningRow
              key={movie.id}
              movie={movie}
              onOpen={() => router.push({ pathname: '/movie/[id]', params: { id: String(movie.id) } })}
              onRemove={() => removeFromEvening(movie.id)}
            />
          ))}
        </ScrollView>
      )}
    </Frame>
  );
}

function EveningRow({
  movie,
  onOpen,
  onRemove,
}: {
  movie: MovieCard;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const year = releaseYear(movie.releaseDate);
  return (
    <View style={styles.row}>
      <Pressable style={styles.main} onPress={onOpen}>
        <Poster path={movie.posterPath} size="w185" style={styles.poster} label={movie.title} />
        <View style={styles.copy}>
          <Text style={styles.film}>{movie.title}</Text>
          <Text style={styles.meta}>
            {[year, formatVote(movie.voteAverage)].filter((part) => part && part !== '—').join('  ·  ')}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Text style={styles.remove}>Убрать</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 4,
  },
  back: {
    color: colors.textMuted,
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.sansSemibold,
    fontSize: 22,
  },
  count: {
    color: colors.textMuted,
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  note: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  poster: {
    width: 52,
    height: 78,
    borderRadius: 8,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  film: {
    color: colors.text,
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  remove: {
    color: colors.nope,
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
  },
});
