import type { Filters, MovieCard } from '@/model';
import { canMixRecommendations, passesClientFilters } from '@/lib/filters';

type DeckInput = {
  discover: MovieCard[];
  recommendations: MovieCard[];
  swipedIds: ReadonlySet<number>;
  likedGenreIds: readonly number[];
  nopedGenreIds: readonly number[];
  filters: Filters;
};

const LIKE_GENRE = 1;
/** «Нет» сильнее лайка — меньше зацикливания на одном жанре (мультики, блокбастеры). */
const NOPE_GENRE = 2;

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

function buildGenreWeights(liked: readonly number[], noped: readonly number[]): Map<number, number> {
  const weights = new Map<number, number>();
  for (const id of liked) {
    weights.set(id, (weights.get(id) ?? 0) + LIKE_GENRE);
  }
  for (const id of noped) {
    weights.set(id, (weights.get(id) ?? 0) - NOPE_GENRE);
  }
  return weights;
}

function genreWeight(movie: MovieCard, weights: Map<number, number>): number {
  return movie.genreIds.reduce((sum, id) => sum + (weights.get(id) ?? 0), 0);
}

/** Перемешивание без скачка порядка при каждом свайпе — seed только от id в пуле. */
function stableShuffle(movies: MovieCard[]): MovieCard[] {
  const out = [...movies];
  let seed = 2166136261;
  for (const movie of movies) {
    seed ^= movie.id;
    seed = Math.imul(seed, 16777619);
  }
  for (let i = out.length - 1; i > 0; i -= 1) {
    seed = Math.imul(seed ^ (seed >>> 16), 2246822507);
    const j = Math.abs(seed) % (i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

function interleaveRecommendations(base: MovieCard[], recommendations: MovieCard[]): MovieCard[] {
  if (recommendations.length === 0) return base;
  const mixed = [...base];
  let slot = 6;
  for (const movie of recommendations) {
    if (mixed.some((item) => item.id === movie.id)) continue;
    const index = Math.min(slot, mixed.length);
    mixed.splice(index, 0, movie);
    slot += 7;
  }
  return mixed;
}

/**
 * Discover + редкие рекомендации TMDB. Лайк слегка подтягивает жанр,
 * «нет» — отталкивает. Основа колоды — перемешанный «общий» пул.
 */
export function buildDeck(input: DeckInput): MovieCard[] {
  const taken = new Set<number>();
  const base = takeUnseen(input.discover, input.swipedIds, taken);
  const recommendations = canMixRecommendations(input.filters)
    ? takeUnseen(input.recommendations, input.swipedIds, taken)
        .filter((movie) => passesClientFilters(movie, input.filters))
        .slice(0, 3)
    : [];

  const weights = buildGenreWeights(input.likedGenreIds, input.nopedGenreIds);

  const boosted: MovieCard[] = [];
  const rest: MovieCard[] = [];
  const deprioritized: MovieCard[] = [];

  for (const movie of base) {
    const score = genreWeight(movie, weights);
    if (score < 0) deprioritized.push(movie);
    else if (score > 0) boosted.push(movie);
    else rest.push(movie);
  }

  boosted.sort((a, b) => genreWeight(b, weights) - genreWeight(a, weights));
  const restShuffled = stableShuffle(rest);
  const tailShuffled = stableShuffle(deprioritized);

  const mixed: MovieCard[] = [];
  let boostedIndex = 0;
  let restIndex = 0;

  while (boostedIndex < boosted.length || restIndex < restShuffled.length) {
    for (let step = 0; step < 2 && restIndex < restShuffled.length; step += 1) {
      const next = restShuffled[restIndex];
      if (next) mixed.push(next);
      restIndex += 1;
    }
    if (boostedIndex < boosted.length) {
      const next = boosted[boostedIndex];
      if (next) mixed.push(next);
      boostedIndex += 1;
    } else if (restIndex < restShuffled.length) {
      const next = restShuffled[restIndex];
      if (next) mixed.push(next);
      restIndex += 1;
    }
  }

  for (const movie of tailShuffled) {
    if (!mixed.some((item) => item.id === movie.id)) mixed.push(movie);
  }

  return interleaveRecommendations(mixed, recommendations);
}