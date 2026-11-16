export function releaseYear(date: string): string {
  return date.length >= 4 ? date.slice(0, 4) : '';
}

export function formatVote(value: number): string {
  if (!value) return '—';
  return value.toFixed(1);
}

export function posterUrl(
  path: string | null,
  size: 'w185' | 'w342' | 'w500' | 'w780' = 'w500',
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function filmsCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} фильм`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} фильма`;
  }
  return `${count} фильмов`;
}

const KNOWN_FOR: Record<string, string> = {
  Acting: 'играет',
  Directing: 'режиссура',
  Writing: 'сценарий',
  Production: 'продюсирование',
  Sound: 'музыка',
  Camera: 'камера',
  Editing: 'монтаж',
};

export function knownForLabel(department: string): string {
  return KNOWN_FOR[department] ?? '';
}
