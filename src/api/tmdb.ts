import type {
  DiscoverPage,
  Filters,
  Genre,
  MovieCard,
  MovieDetails,
  PersonDetails,
} from '@/model';
import { knownForLabel } from '@/lib/format';
import { discoverParams } from '@/lib/filters';
import {
  buildFilmography,
  groupMovieCredits,
  type CastMember,
  type CrewMember,
  type FilmSource,
} from '@/lib/credits';

export class TmdbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TmdbError';
  }
}

export function tmdbApiKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  if (!key || key.trim().length === 0) return undefined;
  return key.trim();
}

export function hasTmdbKey(): boolean {
  return tmdbApiKey() !== undefined;
}

type Query = Record<string, string | number | boolean | undefined>;

async function tmdb<T>(path: string, params: Query = {}): Promise<T> {
  const key = tmdbApiKey();
  if (!key) throw new TmdbError('Нет ключа TMDB');

  const query = new URLSearchParams();
  query.set('api_key', key);
  if (params.language === undefined) query.set('language', 'ru-RU');
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined) continue;
    query.set(name, String(value));
  }

  const response = await fetch(`https://api.themoviedb.org/3${path}?${query}`);
  if (response.status === 401) throw new TmdbError('Ключ TMDB не принят');
  if (!response.ok) throw new TmdbError(`TMDB ответил ${response.status}`);
  return response.json() as Promise<T>;
}

type RawListMovie = {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  original_language?: string;
};

type RawList = {
  page?: number;
  total_pages?: number;
  results?: RawListMovie[];
};

function mapMovie(raw: RawListMovie): MovieCard {
  return {
    id: raw.id,
    title: raw.title || raw.original_title || 'Без названия',
    overview: raw.overview ?? '',
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.release_date ?? '',
    voteAverage: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    genreIds: raw.genre_ids ?? [],
    originalLanguage: raw.original_language ?? '',
  };
}

export async function discoverMovies(filters: Filters, page: number): Promise<DiscoverPage> {
  const data = await tmdb<RawList>('/discover/movie', discoverParams(filters, page));
  return {
    page: data.page ?? page,
    totalPages: data.total_pages ?? page,
    movies: (data.results ?? []).map(mapMovie),
  };
}

export async function getRecommendations(movieId: number): Promise<MovieCard[]> {
  const data = await tmdb<RawList>(`/movie/${movieId}/recommendations`);
  return (data.results ?? []).slice(0, 10).map(mapMovie);
}

export async function getGenres(): Promise<Genre[]> {
  const data = await tmdb<{ genres?: Genre[] }>('/genre/movie/list');
  return data.genres ?? [];
}

type RawDetails = {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  runtime?: number | null;
  vote_average?: number;
  genres?: Genre[];
};

type RawCast = {
  id: number;
  name?: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
};

type RawCrew = {
  id: number;
  name?: string;
  job?: string;
  department?: string;
  profile_path?: string | null;
};

type RawVideo = {
  key?: string;
  site?: string;
  type?: string;
  official?: boolean;
  iso_639_1?: string;
};

function mapCast(raw: RawCast): CastMember {
  return {
    id: raw.id,
    name: raw.name || 'Без имени',
    character: raw.character ?? '',
    profilePath: raw.profile_path ?? null,
  };
}

function mapCrew(raw: RawCrew): CrewMember {
  return {
    id: raw.id,
    name: raw.name || 'Без имени',
    job: raw.job ?? '',
    department: raw.department ?? '',
    profilePath: raw.profile_path ?? null,
  };
}

function trailerScore(video: RawVideo): number {
  let score = 0;
  if (video.type === 'Trailer') score += 5;
  else if (video.type === 'Teaser') score += 3;
  if (video.official) score += 2;
  if (video.iso_639_1 === 'ru') score += 1;
  return score;
}

function pickTrailer(videos: RawVideo[]): string | null {
  const youtube = videos.filter((video) => video.site === 'YouTube' && video.key);
  youtube.sort((a, b) => trailerScore(b) - trailerScore(a));
  const best = youtube[0];
  return best?.key ? `https://www.youtube.com/watch?v=${best.key}` : null;
}

export async function getMovie(id: number): Promise<MovieDetails> {
  const [movie, credits, videos] = await Promise.all([
    tmdb<RawDetails>(`/movie/${id}`),
    tmdb<{ cast?: RawCast[]; crew?: RawCrew[] }>(`/movie/${id}/credits`),
    tmdb<{ results?: RawVideo[] }>(`/movie/${id}/videos`, {
      include_video_language: 'ru,en',
    }),
  ]);

  let overview = movie.overview ?? '';
  let overviewIsFallback = false;
  let title = movie.title || movie.original_title || 'Без названия';

  // Русский запрос часто возвращает пустое описание. Тогда берём английское.
  if (!overview.trim()) {
    const english = await tmdb<RawDetails>(`/movie/${id}`, { language: 'en-US' });
    if (english.overview?.trim()) {
      overview = english.overview;
      overviewIsFallback = true;
    }
    if (title === 'Без названия' && english.title) title = english.title;
  }

  const grouped = groupMovieCredits(
    (credits.cast ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(mapCast),
    (credits.crew ?? []).map(mapCrew),
  );

  return {
    id: movie.id,
    title,
    overview,
    overviewIsFallback,
    posterPath: movie.poster_path ?? null,
    backdropPath: movie.backdrop_path ?? null,
    releaseDate: movie.release_date ?? '',
    runtime: movie.runtime ?? null,
    voteAverage: movie.vote_average ?? 0,
    genres: movie.genres ?? [],
    trailerUrl: pickTrailer(videos.results ?? []),
    cast: grouped.cast,
    directors: grouped.directors,
    writers: grouped.writers,
    composers: grouped.composers,
    producers: grouped.producers,
  };
}

type RawPerson = {
  id: number;
  name?: string;
  biography?: string;
  profile_path?: string | null;
  known_for_department?: string;
};

type RawPersonCredit = {
  id: number;
  title?: string;
  original_title?: string;
  poster_path?: string | null;
  release_date?: string;
  job?: string;
  department?: string;
  character?: string;
};

function mapFilmSource(raw: RawPersonCredit): FilmSource | null {
  const title = raw.title || raw.original_title;
  if (!title) return null;
  return {
    id: raw.id,
    title,
    posterPath: raw.poster_path ?? null,
    releaseDate: raw.release_date ?? '',
    job: raw.job ?? '',
    department: raw.department ?? '',
    character: raw.character,
  };
}

export async function getPerson(id: number): Promise<PersonDetails> {
  const [person, credits] = await Promise.all([
    tmdb<RawPerson>(`/person/${id}`),
    tmdb<{ cast?: RawPersonCredit[]; crew?: RawPersonCredit[] }>(
      `/person/${id}/movie_credits`,
    ),
  ]);

  let biography = person.biography ?? '';
  let biographyIsFallback = false;
  if (!biography.trim()) {
    const english = await tmdb<RawPerson>(`/person/${id}`, { language: 'en-US' });
    if (english.biography?.trim()) {
      biography = english.biography;
      biographyIsFallback = true;
    }
  }

  const cast = (credits.cast ?? [])
    .map(mapFilmSource)
    .filter((item): item is FilmSource => item !== null);
  const crew = (credits.crew ?? [])
    .map(mapFilmSource)
    .filter((item): item is FilmSource => item !== null);

  return {
    id: person.id,
    name: person.name || 'Без имени',
    biography,
    biographyIsFallback,
    profilePath: person.profile_path ?? null,
    knownFor: knownForLabel(person.known_for_department ?? ''),
    sections: buildFilmography(cast, crew),
  };
}
