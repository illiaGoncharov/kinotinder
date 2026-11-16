import { useQuery } from '@tanstack/react-query';

import { getMovie, getPerson } from '@/api/tmdb';

export function useMovie(id: number) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: () => getMovie(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function usePerson(id: number) {
  return useQuery({
    queryKey: ['person', id],
    queryFn: () => getPerson(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
