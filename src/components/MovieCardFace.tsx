import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { Poster } from '@/components/Poster';
import { formatVote, releaseYear } from '@/lib/format';
import type { Genre, MovieCard } from '@/model';
import { colors, fonts } from '@/theme';

type Props = {
  movie: MovieCard;
  genres: Genre[];
};

function genreLine(ids: number[], genres: Genre[]): string {
  const names: string[] = [];
  for (const id of ids) {
    const genre = genres.find((item) => item.id === id);
    if (!genre) continue;
    names.push(genre.name);
    if (names.length === 3) break;
  }
  return names.join('  ·  ');
}

export function MovieCardFace({ movie, genres }: Props) {
  const year = releaseYear(movie.releaseDate);
  const genresText = genreLine(movie.genreIds, genres);
  const meta = [year, formatVote(movie.voteAverage)].filter((part) => part && part !== '—').join('  ·  ');

  return (
    <View style={styles.card}>
      <Poster path={movie.posterPath} size="w780" style={styles.poster} label={movie.title} />
      <LinearGradient
        colors={['transparent', 'rgba(20, 16, 36, 0.15)', 'rgba(12, 13, 18, 0.96)']}
        locations={[0.32, 0.58, 1]}
        style={styles.shade}
      />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {movie.title}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {genresText ? <Text style={styles.genres}>{genresText}</Text> : null}
        {movie.overview ? (
          <Text style={styles.overview} numberOfLines={2}>
            {movie.overview}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.indigoDeep,
    borderWidth: 1,
    borderColor: colors.line,
  },
  poster: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  shade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  copy: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    gap: 6,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
  },
  meta: {
    color: colors.accentBright,
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  genres: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  overview: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
});
