import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { Poster } from '@/components/Poster';
import { formatVote, releaseYear } from '@/lib/format';
import type { Genre, MovieCard } from '@/model';
import { colors, fonts, radii } from '@/theme';

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
  return names.join(' · ');
}

export function MovieCardFace({ movie, genres }: Props) {
  const year = releaseYear(movie.releaseDate);
  const genresText = genreLine(movie.genreIds, genres);
  const meta = [year, formatVote(movie.voteAverage)].filter((part) => part && part !== '—').join(' · ');

  return (
    <View style={styles.card}>
      <Poster path={movie.posterPath} size="w780" style={styles.poster} label={movie.title} />
      <LinearGradient
        colors={['transparent', 'rgba(13, 17, 23, 0.08)', 'rgba(13, 17, 23, 0.55)', 'rgba(13, 17, 23, 0.96)']}
        locations={[0.35, 0.55, 0.78, 1]}
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
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.posterFallback,
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
    left: 16,
    right: 16,
    bottom: 16,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  genres: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  overview: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});