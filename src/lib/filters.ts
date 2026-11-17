import type { Filters, MovieCard, OtherLanguage } from '@/model';

export const defaultFilters: Filters = {
  genreIds: [],
  yearFrom: null,
  yearTo: null,
  minVote: 6,
  minVoteCount: 200,
  runtime: 'any',
  language: 'any',
  otherLanguage: 'fr',
  certification: null,
  sort: 'vote_average.desc',
};

const DISCOVER_SORT_ROTATION: Filters['sort'][] = [
  'vote_average.desc',
  'primary_release_date.desc',
  'popularity.desc',
];

export const DECADES = [
  { label: '2020-е', from: 2020, to: 2029 },
  { label: '2010-е', from: 2010, to: 2019 },
  { label: '2000-е', from: 2000, to: 2009 },
  { label: '1990-е', from: 1990, to: 1999 },
  { label: '1980-е', from: 1980, to: 1989 },
  { label: '1970-е', from: 1970, to: 1979 },
] as const;

export const OTHER_LANGUAGES: { code: OtherLanguage; label: string }[] = [
  { code: 'fr', label: 'французский' },
  { code: 'de', label: 'немецкий' },
  { code: 'es', label: 'испанский' },
  { code: 'it', label: 'итальянский' },
  { code: 'ja', label: 'японский' },
  { code: 'ko', label: 'корейский' },
];

export function filtersAreDefault(filters: Filters): boolean {
  return (
    filters.genreIds.length === 0 &&
    filters.yearFrom === defaultFilters.yearFrom &&
    filters.yearTo === defaultFilters.yearTo &&
    filters.minVote === defaultFilters.minVote &&
    filters.minVoteCount === defaultFilters.minVoteCount &&
    filters.runtime === defaultFilters.runtime &&
    filters.language === defaultFilters.language &&
    filters.otherLanguage === defaultFilters.otherLanguage &&
    filters.certification === defaultFilters.certification &&
    filters.sort === defaultFilters.sort
  );
}

export function originalLanguage(filters: Filters): string | null {
  if (filters.language === 'any') return null;
  if (filters.language === 'other') return filters.otherLanguage;
  return filters.language;
}

/**
 * Длину и возрастную метку с карточки рекомендации не проверить:
 * в ответе recommendations их нет. Пока фильтр включён, чужие фильмы не подмешиваем.
 */
export function canMixRecommendations(filters: Filters): boolean {
  return filters.runtime === 'any' && filters.certification === null;
}

export function discoverParams(
  filters: Filters,
  page: number,
): Record<string, string | number | boolean> {
  // На дефолтной сортировке меняем её по страницам — иначе вечно одни «Мстители» и мультфильмы.
  const sortBy =
    filters.sort === defaultFilters.sort
      ? (DISCOVER_SORT_ROTATION[(page - 1) % DISCOVER_SORT_ROTATION.length] ??
        defaultFilters.sort)
      : filters.sort;

  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: sortBy,
    include_adult: false,
    'vote_average.gte': filters.minVote,
    'vote_count.gte': filters.minVoteCount,
  };

  // Запятая в TMDB значит «все жанры сразу». Вертикальная черта — «любой из».
  if (filters.genreIds.length > 0) {
    params.with_genres = filters.genreIds.join('|');
  }
  if (filters.yearFrom) {
    params['primary_release_date.gte'] = `${filters.yearFrom}-01-01`;
  }
  if (filters.yearTo) {
    params['primary_release_date.lte'] = `${filters.yearTo}-12-31`;
  }
  if (filters.runtime === 'short') params['with_runtime.lte'] = 100;
  if (filters.runtime === 'medium') {
    params['with_runtime.gte'] = 100;
    params['with_runtime.lte'] = 140;
  }
  if (filters.runtime === 'long') params['with_runtime.gte'] = 141;

  const language = originalLanguage(filters);
  if (language) params.with_original_language = language;
  if (filters.certification) {
    params.certification_country = 'RU';
    params.certification = filters.certification;
  }
  return params;
}

function releaseYearNumber(date: string): number | null {
  if (date.length < 4) return null;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

/** Те же жёсткие фильтры, что у discover, но по полям, которые есть на карточке. */
export function passesClientFilters(movie: MovieCard, filters: Filters): boolean {
  if (
    filters.genreIds.length > 0 &&
    !movie.genreIds.some((id) => filters.genreIds.includes(id))
  ) {
    return false;
  }

  if (filters.yearFrom !== null || filters.yearTo !== null) {
    const year = releaseYearNumber(movie.releaseDate);
    if (year === null) return false;
    if (filters.yearFrom !== null && year < filters.yearFrom) return false;
    if (filters.yearTo !== null && year > filters.yearTo) return false;
  }

  if (movie.voteAverage < filters.minVote) return false;
  if (movie.voteCount < filters.minVoteCount) return false;

  const language = originalLanguage(filters);
  if (language && movie.originalLanguage !== language) return false;
  return true;
}
