import type { Filters, MovieCard } from '@/model';
import { canMixRecommendations, passesClientFilters } from '@/lib/filters';

type DeckInput = {
  discover: MovieCard[];
  recommendations: MovieCard[];
  swipedIds: ReadonlySet<number>;
  likedGenreIds: readonly number[];
  filters: Filters;
};

function takeUnseen(
  movies: MovieCard[],
  swiped: ReadonlySet<number>,
  taken: Set<number>,
): MovieCard[] {
  const fresh: MovieCard[] = [];
  for (const movie of movies) {
    if (swiped.has(movie.id) || taken.has(movie.id)) continue;
    taken.add(movie.id);
    fresh.push(movie);
  }
  return fresh;
}

function genreWeight(movie: MovieCard, weights: Map<number, number>): number {
  return movie.genreIds.reduce((sum, id) => sum + (weights.get(id) ?? 0), 0);
}

/**
 * Колода строится из discover. Жанры лайков поднимают карточку вверх,
 * но не выкидывают остальные: два «близких», потом один обычный.
 * Рекомендации последних лайков вставляются между ними и только если
 * сами проходят жёсткие фильтры.
 */
export function buildDeck(input: DeckInput): MovieCard[] {
  const taken = new Set<number>();
  const base = takeUnseen(input.discover, input.swipedIds, taken);
  const recommendations = canMixRecommendations(input.filters)
    ? takeUnseen(input.recommendations, input.swipedIds, taken)
        .filter((movie) => passesClientFilters(movie, input.filters))
        .slice(0, 8)
    : [];

  const weights = new Map<number, number>();
  for (const id of input.likedGenreIds) {
    weights.set(id, (weights.get(id) ?? 0) + 1);
  }

  const boosted: MovieCard[] = [];
  const rest: MovieCard[] = [];
  for (const movie of base) {
    if (genreWeight(movie, weights) > 0) boosted.push(movie);
    else rest.push(movie);
  }
  boosted.sort((a, b) => genreWeight(b, weights) - genreWeight(a, weights));

  const mixed: MovieCard[] = [];
  let boostedIndex = 0;
  let restIndex = 0;
  let recommendationIndex = 0;

  while (
    boostedIndex < boosted.length ||
    restIndex < rest.length ||
    recommendationIndex < recommendations.length
  ) {
    const before = mixed.length;
    for (
      let step = 0;
      step < 2 && (boostedIndex < boosted.length || restIndex < rest.length);
      step += 1
    ) {
      if (boostedIndex < boosted.length) {
        const next = boosted[boostedIndex];
        if (next) mixed.push(next);
        boostedIndex += 1;
      } else {
        const next = rest[restIndex];
        if (next) mixed.push(next);
        restIndex += 1;
      }
    }
    if (recommendationIndex < recommendations.length) {
      const next = recommendations[recommendationIndex];
      if (next) mixed.push(next);
      recommendationIndex += 1;
    }
    if (mixed.length === before) break;
  }

  return mixed;
}
