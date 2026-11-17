import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { discoverMovies, getGenres, getRecommendations, hasTmdbKey } from '@/api/tmdb';
import { buildDeck } from '@/lib/deck';
import { canMixRecommendations } from '@/lib/filters';
import { useHydrated } from '@/hooks/useHydrated';
import type { MovieCard } from '@/model';
import { useFiltersStore } from '@/store/filters';
import { useSwipesStore } from '@/store/swipes';

export type DeckStatus = 'needs-key' | 'loading' | 'error' | 'empty' | 'ready';

export function useDeck() {
  const hydrated = useHydrated();
  const filters = useFiltersStore((state) => state.filters);
  const swipes = useSwipesStore((state) => state.swipes);
  const cards = useSwipesStore((state) => state.cards);
  const keyReady = hasTmdbKey();

  const genresQuery = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
    enabled: keyReady,
    staleTime: Infinity,
  });

  const discover = useInfiniteQuery({
    queryKey: ['discover', filters],
    queryFn: ({ pageParam }) => discoverMovies(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: keyReady && hydrated,
  });

  const likeIds = swipes
    .filter((swipe) => swipe.direction === 'like')
    .slice(-1)
    .map((swipe) => swipe.movieId);
  const mixRecommendations = canMixRecommendations(filters);

  const recommendationQueries = useQueries({
    queries: likeIds.map((id) => ({
      queryKey: ['recommendations', id] as const,
      queryFn: () => getRecommendations(id),
      enabled: keyReady && mixRecommendations,
      staleTime: 10 * 60 * 1000,
    })),
  });

  const swipedIds = useMemo(
    () => new Set(swipes.map((swipe) => swipe.movieId)),
    [swipes],
  );

  const likedGenreIds = useMemo(() => {
    const ids: number[] = [];
    for (const swipe of swipes) {
      if (swipe.direction !== 'like') continue;
      const card = cards[swipe.movieId];
      if (card) ids.push(...card.genreIds);
    }
    return ids;
  }, [swipes, cards]);

  const nopedGenreIds = useMemo(() => {
    const ids: number[] = [];
    for (const swipe of swipes) {
      if (swipe.direction !== 'nope') continue;
      const card = cards[swipe.movieId];
      if (card) ids.push(...card.genreIds);
    }
    return ids;
  }, [swipes, cards]);

  const discoverMoviesFlat = useMemo(
    () => discover.data?.pages.flatMap((page) => page.movies) ?? [],
    [discover.data],
  );

  const recommendations = useMemo(
    () => recommendationQueries.flatMap((query) => query.data ?? []),
    [recommendationQueries],
  );

  const movies = useMemo(
    () =>
      buildDeck({
        discover: discoverMoviesFlat,
        recommendations,
        swipedIds,
        likedGenreIds,
        nopedGenreIds,
        filters,
      }),
    [discoverMoviesFlat, recommendations, swipedIds, likedGenreIds, nopedGenreIds, filters],
  );

  useEffect(() => {
    if (!hydrated || !keyReady) return;
    if (movies.length >= 8) return;
    if (!discover.hasNextPage || discover.isFetchingNextPage || discover.isFetchNextPageError) {
      return;
    }
    void discover.fetchNextPage();
  }, [
    hydrated,
    keyReady,
    movies.length,
    discover.hasNextPage,
    discover.isFetchingNextPage,
    discover.isFetchNextPageError,
    discover.fetchNextPage,
  ]);

  let status: DeckStatus = 'loading';
  if (!keyReady) status = 'needs-key';
  else if (!hydrated) status = 'loading';
  else if (movies.length > 0) status = 'ready';
  else if (discover.isError) status = 'error';
  else if (discover.isFetching || discover.hasNextPage) status = 'loading';
  else if (discover.isFetched) status = 'empty';

  return {
    movies,
    genres: genresQuery.data ?? [],
    status,
    hasMoreError: discover.isFetchNextPageError,
    retry: () => {
      if (discover.isFetchNextPageError) void discover.fetchNextPage();
      else void discover.refetch();
    },
  };
}

export type { MovieCard };
