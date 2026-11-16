import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Attribution } from '@/components/Attribution';
import { Frame, Message } from '@/components/Frame';
import { Poster } from '@/components/Poster';
import { usePerson } from '@/hooks/useCatalog';
import { releaseYear } from '@/lib/format';
import type { FilmSection } from '@/model';
import { colors, fonts } from '@/theme';

export default function PersonScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = Number(id);
  const query = usePerson(personId);
  const person = query.data;

  return (
    <Frame>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <Pressable style={[styles.back, { marginTop: insets.top + 8 }]} onPress={() => router.back()}>
          <Text style={styles.backText}>Назад</Text>
        </Pressable>

        {query.isLoading ? <Message title="Смотрим, кто это" /> : null}
        {query.isError ? (
          <Message title="Человек не открылся" body="Проверь сеть и попробуй ещё раз." />
        ) : null}

        {person ? (
          <View style={styles.body}>
            <View style={styles.header}>
              <Poster path={person.profilePath} size="w342" style={styles.photo} label={person.name} />
              <View style={styles.headerCopy}>
                <Text style={styles.name}>{person.name}</Text>
                {person.knownFor ? <Text style={styles.known}>{person.knownFor}</Text> : null}
              </View>
            </View>

            {person.biography ? (
              <Text style={styles.bio}>{person.biography}</Text>
            ) : (
              <Text style={styles.fallback}>Биографии нет.</Text>
            )}
            {person.biographyIsFallback ? (
              <Text style={styles.fallback}>На русском биографии нет, это английский текст.</Text>
            ) : null}
            {!person.profilePath ? <Text style={styles.fallback}>Фото нет.</Text> : null}

            {person.sections.length === 0 ? (
              <Text style={styles.fallback}>Фильмография пустая.</Text>
            ) : (
              person.sections.map((section) => (
                <FilmList key={section.title} section={section} />
              ))
            )}
            <Attribution />
          </View>
        ) : null}
      </ScrollView>
    </Frame>
  );
}

function FilmList({ section }: { section: FilmSection }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.items.map((film) => (
        <Pressable
          key={`${section.title}-${film.id}`}
          style={styles.row}
          onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(film.id) } })}>
          <Poster path={film.posterPath} size="w185" style={styles.poster} label={film.title} />
          <View style={styles.rowCopy}>
            <Text style={styles.filmTitle}>{film.title}</Text>
            <Text style={styles.filmMeta}>
              {[releaseYear(film.releaseDate), film.role].filter(Boolean).join('  ·  ')}
            </Text>
          </View>
        </Pressable>
      ))}
      {section.more > 0 ? <Text style={styles.more}>и ещё {section.more}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  back: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: colors.text,
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
  },
  body: {
    paddingHorizontal: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  photo: {
    width: 96,
    height: 128,
    borderRadius: 18,
    backgroundColor: colors.indigo,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
  },
  known: {
    color: colors.accentBright,
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
  },
  bio: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  fallback: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginTop: 12,
    gap: 10,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  poster: {
    width: 48,
    height: 72,
    borderRadius: 8,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  filmTitle: {
    color: colors.text,
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
  },
  filmMeta: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  more: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
});
