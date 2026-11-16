export type SwipeDirection = 'like' | 'nope';

/** Для будущей комнаты на двоих: сравниваются только id и направление. */
export type Swipe = {
  movieId: number;
  direction: SwipeDirection;
};

export type MovieCard = {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  genreIds: number[];
  originalLanguage: string;
};

export type Genre = {
  id: number;
  name: string;
};

export type RuntimeFilter = 'any' | 'short' | 'medium' | 'long';
export type LanguageFilter = 'any' | 'en' | 'ru' | 'other';
export type OtherLanguage = 'fr' | 'de' | 'es' | 'it' | 'ja' | 'ko';
export type SortKey =
  | 'popularity.desc'
  | 'vote_average.desc'
  | 'primary_release_date.desc';

export type Filters = {
  genreIds: number[];
  yearFrom: number | null;
  yearTo: number | null;
  minVote: number;
  minVoteCount: number;
  runtime: RuntimeFilter;
  language: LanguageFilter;
  otherLanguage: OtherLanguage;
  certification: string | null;
  sort: SortKey;
};

export type DiscoverPage = {
  page: number;
  totalPages: number;
  movies: MovieCard[];
};

export type CreditPerson = {
  id: number;
  name: string;
  role: string;
  profilePath: string | null;
};

export type MovieDetails = {
  id: number;
  title: string;
  overview: string;
  overviewIsFallback: boolean;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  runtime: number | null;
  voteAverage: number;
  genres: Genre[];
  trailerUrl: string | null;
  cast: CreditPerson[];
  directors: CreditPerson[];
  writers: CreditPerson[];
  composers: CreditPerson[];
  producers: CreditPerson[];
};

export type FilmCredit = {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate: string;
  role: string;
};

export type FilmSection = {
  title: string;
  items: FilmCredit[];
  more: number;
};

export type PersonDetails = {
  id: number;
  name: string;
  biography: string;
  biographyIsFallback: boolean;
  profilePath: string | null;
  knownFor: string;
  sections: FilmSection[];
};
