import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Attribution } from '@/components/Attribution';
import { Frame, Message } from '@/components/Frame';
import { Poster } from '@/components/Poster';
import { useMovie } from '@/hooks/useCatalog';
import { formatVote, releaseYear } from '@/lib/format';
import type { CreditPerson } from '@/model';
import { colors, fonts } from '@/theme';

export default function MovieScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const movieId = Number(id);
  const query = useMovie(movieId);
  const movie = query.data;

  return (
    <Frame>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.hero}>
          <Poster
            path={movie?.backdropPath || movie?.posterPath || null}
            size="w780"
            style={styles.heroImage}
            label={movie?.title}
          />
          <View style={styles.heroShade} />
          <Pressable
            style={[styles.back, { top: insets.top + 8 }]}
            onPress={() => router.back()}
            hitSlop={8}>
            <Text style={styles.backText}>Назад</Text>
          </Pressable>
        </View>

        {query.isLoading ? <Message title="Открываем карточку" /> : null}
        {query.isError ? (
          <Message title="Карточка не открылась" body="Проверь сеть и попробуй ещё раз." />
        ) : null}

        {movie ? (
          <View style={styles.body}>
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={styles.meta}>
              {[
                releaseYear(movie.releaseDate),
                movie.runtime ? `${movie.runtime} мин` : '',
                formatVote(movie.voteAverage),
              ]
                .filter(Boolean)
                .join('  ·  ')}
            </Text>
            {movie.genres.length > 0 ? (
              <Text style={styles.genres}>{movie.genres.map((genre) => genre.name).join('  ·  ')}</Text>
            ) : null}

            {movie.overview ? (
              <Text style={styles.overview}>{movie.overview}</Text>
            ) : (
              <Text style={styles.fallback}>Описания нет.</Text>
            )}
            {movie.overviewIsFallback ? (
              <Text style={styles.fallback}>На русском описания нет, это английский текст.</Text>
            ) : null}

            {movie.trailerUrl ? (
              <Pressable style={styles.trailer} onPress={() => Linking.openURL(movie.trailerUrl!)}>
                <Text style={styles.trailerText}>Трейлер</Text>
              </Pressable>
            ) : null}

            <Cast people={movie.cast} />
            <People title="Режиссёр" people={movie.directors} />
            <People title="Сценарий" people={movie.writers} />
            <People title="Музыка" people={movie.composers} />
            <People title="Продюсеры" people={movie.producers} />
            <Attribution />
          </View>
        ) : null}
      </ScrollView>
    </Frame>
  );
}

function openPerson(id: number) {
  router.push({ pathname: '/person/[id]', params: { id: String(id) } });
}

function Cast({ people }: { people: CreditPerson[] }) {
  if (people.length === 0) return null;
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>В ролях</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castRow}>
        {people.map((person) => (
          <Pressable key={person.id} style={styles.castItem} onPress={() => openPerson(person.id)}>
            <Poster path={person.profilePath} size="w185" style={styles.castPhoto} label={person.name} />
            <Text style={styles.personName} numberOfLines={2}>
              {person.name}
            </Text>
            <Text style={styles.personRole} numberOfLines={2}>
              {person.role}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function People({ title, people }: { title: string; people: CreditPerson[] }) {
  if (people.length === 0) return null;
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {people.map((person) => (
        <Pressable key={`${title}-${person.id}`} style={styles.personRow} onPress={() => openPerson(person.id)}>
          <Poster path={person.profilePath} size="w185" style={styles.avatar} label={person.name} />
          <View style={styles.personCopy}>
            <Text style={styles.personName}>{person.name}</Text>
            <Text style={styles.personRole}>{person.role}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  hero: {
    height: 280,
    backgroundColor: colors.indigoDeep,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(12, 13, 18, 0.28)',
  },
  back: {
    position: 'absolute',
    left: 16,
    backgroundColor: 'rgba(12, 13, 18, 0.72)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: colors.text,
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
  },
  meta: {
    color: colors.accentBright,
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
  },
  genres: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  overview: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 6,
  },
  fallback: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  trailer: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  trailerText: {
    color: colors.accentBright,
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
  block: {
    marginTop: 18,
    gap: 10,
  },
  blockTitle: {
    color: colors.textMuted,
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  castRow: {
    gap: 12,
    paddingRight: 8,
  },
  castItem: {
    width: 92,
    gap: 6,
  },
  castPhoto: {
    width: 92,
    height: 122,
    borderRadius: 16,
  },
  personRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  personCopy: {
    flex: 1,
    gap: 2,
  },
  personName: {
    color: colors.text,
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
  },
  personRole: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
});
