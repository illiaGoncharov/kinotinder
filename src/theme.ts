/** Отступы и скругления — одно место, без «пилюль везде». */
export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  card: 18,
  full: 999,
} as const;

export const colors = {
  bg: '#0d1117',
  bgElevated: '#161b22',
  card: '#1c2128',
  /** Под постером, если фото нет */
  posterFallback: '#21262d',
  line: '#30363d',
  lineMuted: '#21262d',
  text: '#e6edf3',
  textMuted: '#8b949e',
  textFaint: '#6e7681',
  /** Лайк: спокойный красный, не «бархат» */
  accent: '#cf222e',
  accentBright: '#f85149',
  accentSoft: 'rgba(248, 81, 73, 0.14)',
  link: '#58a6ff',
  nope: '#8b949e',
  likeWash: 'rgba(248, 81, 73, 0.16)',
  nopeWash: 'rgba(110, 118, 129, 0.12)',
  seenWash: 'rgba(88, 166, 255, 0.1)',
  laterWash: 'rgba(210, 168, 255, 0.12)',
  focus: 'rgba(88, 166, 255, 0.35)',
};

export const fonts = {
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemibold: 'IBMPlexSans_600SemiBold',
  sansBold: 'IBMPlexSans_700Bold',
  /** Заголовки на карточке — тот же гротеск, не «киношный» сериф */
  title: 'IBMPlexSans_600SemiBold',
};