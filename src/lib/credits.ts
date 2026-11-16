import type { CreditPerson, FilmCredit, FilmSection } from '@/model';

export type CrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath: string | null;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
};

export type FilmSource = {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate: string;
  job: string;
  department: string;
  character?: string;
};

const WRITER_JOBS = new Set(['Screenplay', 'Writer', 'Story', 'Author']);
const PRODUCER_JOBS = new Set(['Producer', 'Executive Producer']);

const ROLE_RU: Record<string, string> = {
  Director: 'режиссёр',
  Screenplay: 'сценарий',
  Writer: 'сценарий',
  Story: 'сюжет',
  Author: 'автор',
  'Original Music Composer': 'композитор',
  Producer: 'продюсер',
  'Executive Producer': 'исполнительный продюсер',
};

const SECTION_LIMIT = 24;

export function roleLabel(job: string): string {
  return ROLE_RU[job] ?? job;
}

function writerRank(job: string): number {
  if (job === 'Screenplay') return 0;
  if (job === 'Writer') return 1;
  if (job === 'Story') return 2;
  if (job === 'Author') return 3;
  return 9;
}

function dedupeCrew(
  people: CrewMember[],
  rank: (job: string) => number,
): CreditPerson[] {
  const best = new Map<number, CrewMember>();
  for (const person of people) {
    const previous = best.get(person.id);
    if (!previous || rank(person.job) < rank(previous.job)) {
      best.set(person.id, person);
    }
  }
  return [...best.values()].map((person) => ({
    id: person.id,
    name: person.name,
    role: roleLabel(person.job),
    profilePath: person.profilePath,
  }));
}

export function groupMovieCredits(cast: CastMember[], crew: CrewMember[]) {
  const seenCast = new Set<number>();
  const uniqueCast: CreditPerson[] = [];
  for (const person of cast) {
    if (seenCast.has(person.id)) continue;
    seenCast.add(person.id);
    uniqueCast.push({
      id: person.id,
      name: person.name,
      role: person.character || 'в кадре',
      profilePath: person.profilePath,
    });
    if (uniqueCast.length === 12) break;
  }

  return {
    cast: uniqueCast,
    directors: dedupeCrew(
      crew.filter((person) => person.job === 'Director'),
      () => 0,
    ),
    writers: dedupeCrew(
      crew.filter(
        (person) => person.department === 'Writing' && WRITER_JOBS.has(person.job),
      ),
      writerRank,
    ),
    composers: dedupeCrew(
      crew.filter((person) => person.job === 'Original Music Composer'),
      () => 0,
    ),
    producers: dedupeCrew(
      crew.filter((person) => PRODUCER_JOBS.has(person.job)),
      (job) => (job === 'Producer' ? 0 : 1),
    ),
  };
}

function byDateDesc(a: FilmCredit, b: FilmCredit): number {
  if (!a.releaseDate && !b.releaseDate) return 0;
  if (!a.releaseDate) return 1;
  if (!b.releaseDate) return -1;
  return b.releaseDate.localeCompare(a.releaseDate);
}

function toCredit(source: FilmSource, role: string): FilmCredit {
  return {
    id: source.id,
    title: source.title,
    posterPath: source.posterPath,
    releaseDate: source.releaseDate,
    role,
  };
}

function section(title: string, items: FilmCredit[]): FilmSection | null {
  if (items.length === 0) return null;
  const unique: FilmCredit[] = [];
  const seen = new Set<number>();
  for (const item of [...items].sort(byDateDesc)) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return {
    title,
    items: unique.slice(0, SECTION_LIMIT),
    more: Math.max(0, unique.length - SECTION_LIMIT),
  };
}

/** Режем фильмографию по делу человека, иначе список из сотен кредитов нечитаемый. */
export function buildFilmography(cast: FilmSource[], crew: FilmSource[]): FilmSection[] {
  const directed = crew
    .filter((item) => item.job === 'Director')
    .map((item) => toCredit(item, roleLabel(item.job)));
  const wrote = crew
    .filter((item) => item.department === 'Writing' && WRITER_JOBS.has(item.job))
    .map((item) => toCredit(item, roleLabel(item.job)));
  const composed = crew
    .filter((item) => item.job === 'Original Music Composer')
    .map((item) => toCredit(item, roleLabel(item.job)));
  const produced = crew
    .filter((item) => PRODUCER_JOBS.has(item.job))
    .map((item) => toCredit(item, roleLabel(item.job)));
  const acted = cast.map((item) =>
    toCredit(item, item.character?.trim() || 'в кадре'),
  );

  return [
    section('Снял', directed),
    section('Написал', wrote),
    section('Музыка', composed),
    section('Продюсировал', produced),
    section('Играл', acted),
  ].filter((item): item is FilmSection => item !== null);
}
