import { useEffect, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { DECADES, OTHER_LANGUAGES } from '@/lib/filters';
import type { Genre, OtherLanguage, RuntimeFilter, SortKey } from '@/model';
import { useFiltersStore } from '@/store/filters';
import { colors, fonts, radii } from '@/theme';

type Props = {
  visible: boolean;
  genres: Genre[];
  onClose: () => void;
};

const VOTES = [
  { value: 0, label: 'любая' },
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
];

const VOTE_COUNTS = [50, 200, 1000];

const RUNTIMES: { id: RuntimeFilter; label: string }[] = [
  { id: 'any', label: 'любая' },
  { id: 'short', label: 'до 100 мин' },
  { id: 'medium', label: '100–140' },
  { id: 'long', label: 'дольше' },
];

const CERTS = ['0+', '6+', '12+', '16+', '18+'];

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'popularity.desc', label: 'популярные' },
  { id: 'vote_average.desc', label: 'по оценке' },
  { id: 'primary_release_date.desc', label: 'новее' },
];

export function FilterSheet({ visible, genres, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const filters = useFiltersStore((state) => state.filters);
  const setFilters = useFiltersStore((state) => state.setFilters);
  const toggleGenre = useFiltersStore((state) => state.toggleGenre);
  const reset = useFiltersStore((state) => state.reset);
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');

  useEffect(() => {
    setFromText(filters.yearFrom ? String(filters.yearFrom) : '');
    setToText(filters.yearTo ? String(filters.yearTo) : '');
  }, [filters.yearFrom, filters.yearTo]);

  function applyYear(text: string, edge: 'yearFrom' | 'yearTo') {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (edge === 'yearFrom') setFromText(digits);
    else setToText(digits);
    if (digits.length === 0) setFilters({ [edge]: null });
    if (digits.length === 4) {
      const year = Number(digits);
      setFilters({ [edge]: year >= 1890 && year <= 2100 ? year : null });
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Закрыть фильтры" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Фильтры</Text>
            <Pressable onPress={reset} hitSlop={8}>
              <Text style={styles.reset}>Сбросить</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Section title="Жанры">
              {genres.length === 0 ? (
                <Text style={styles.hint}>Жанры появятся, когда TMDB ответит.</Text>
              ) : (
                <View style={styles.row}>
                  {genres.map((genre) => (
                    <Chip
                      key={genre.id}
                      label={genre.name}
                      selected={filters.genreIds.includes(genre.id)}
                      onPress={() => toggleGenre(genre.id)}
                    />
                  ))}
                </View>
              )}
            </Section>

            <Section title="Годы">
              <View style={styles.row}>
                <Chip
                  label="любые"
                  selected={filters.yearFrom === null && filters.yearTo === null}
                  onPress={() => setFilters({ yearFrom: null, yearTo: null })}
                />
                {DECADES.map((decade) => (
                  <Chip
                    key={decade.label}
                    label={decade.label}
                    selected={filters.yearFrom === decade.from && filters.yearTo === decade.to}
                    onPress={() => setFilters({ yearFrom: decade.from, yearTo: decade.to })}
                  />
                ))}
              </View>
              <View style={styles.years}>
                <YearField
                  placeholder="от"
                  value={fromText}
                  onChangeText={(text) => applyYear(text, 'yearFrom')}
                  onBlur={() => {
                    if (fromText.length > 0 && fromText.length < 4) {
                      setFromText(filters.yearFrom ? String(filters.yearFrom) : '');
                    }
                  }}
                />
                <YearField
                  placeholder="до"
                  value={toText}
                  onChangeText={(text) => applyYear(text, 'yearTo')}
                  onBlur={() => {
                    if (toText.length > 0 && toText.length < 4) {
                      setToText(filters.yearTo ? String(filters.yearTo) : '');
                    }
                  }}
                />
              </View>
            </Section>

            <Section title="Оценка">
              <View style={styles.row}>
                {VOTES.map((vote) => (
                  <Chip
                    key={vote.value}
                    label={vote.label}
                    selected={filters.minVote === vote.value}
                    onPress={() => setFilters({ minVote: vote.value })}
                  />
                ))}
              </View>
            </Section>

            <Section title="Число голосов">
              <View style={styles.row}>
                {VOTE_COUNTS.map((count) => (
                  <Chip
                    key={count}
                    label={`от ${count}`}
                    selected={filters.minVoteCount === count}
                    onPress={() => setFilters({ minVoteCount: count })}
                  />
                ))}
              </View>
              <Text style={styles.hint}>Без порога в колоду попадает мусор с одной «десяткой».</Text>
            </Section>

            <Section title="Длина">
              <View style={styles.row}>
                {RUNTIMES.map((runtime) => (
                  <Chip
                    key={runtime.id}
                    label={runtime.label}
                    selected={filters.runtime === runtime.id}
                    onPress={() => setFilters({ runtime: runtime.id })}
                  />
                ))}
              </View>
            </Section>

            <Section title="Язык оригинала">
              <View style={styles.row}>
                <Chip
                  label="любой"
                  selected={filters.language === 'any'}
                  onPress={() => setFilters({ language: 'any' })}
                />
                <Chip
                  label="английский"
                  selected={filters.language === 'en'}
                  onPress={() => setFilters({ language: 'en' })}
                />
                <Chip
                  label="русский"
                  selected={filters.language === 'ru'}
                  onPress={() => setFilters({ language: 'ru' })}
                />
                <Chip
                  label="другой"
                  selected={filters.language === 'other'}
                  onPress={() => setFilters({ language: 'other' })}
                />
              </View>
              {filters.language === 'other' ? (
                <View style={styles.row}>
                  {OTHER_LANGUAGES.map((language) => (
                    <Chip
                      key={language.code}
                      label={language.label}
                      selected={filters.otherLanguage === language.code}
                      onPress={() =>
                        setFilters({
                          language: 'other',
                          otherLanguage: language.code as OtherLanguage,
                        })
                      }
                    />
                  ))}
                </View>
              ) : null}
            </Section>

            <Section title="Возраст, Россия">
              <View style={styles.row}>
                <Chip
                  label="любая"
                  selected={filters.certification === null}
                  onPress={() => setFilters({ certification: null })}
                />
                {CERTS.map((cert) => (
                  <Chip
                    key={cert}
                    label={cert}
                    selected={filters.certification === cert}
                    onPress={() => setFilters({ certification: cert })}
                  />
                ))}
              </View>
            </Section>

            <Section title="Сортировка">
              <View style={styles.row}>
                {SORTS.map((sort) => (
                  <Chip
                    key={sort.id}
                    label={sort.label}
                    selected={filters.sort === sort.id}
                    onPress={() => setFilters({ sort: sort.id })}
                  />
                ))}
              </View>
            </Section>
          </ScrollView>

          <Pressable style={styles.done} onPress={onClose}>
            <Text style={styles.doneText}>Готово</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function YearField({
  value,
  placeholder,
  onChangeText,
  onBlur,
}: {
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
}) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      onChangeText={onChangeText}
      onBlur={onBlur}
      keyboardType="number-pad"
      maxLength={4}
      style={styles.yearInput}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(6, 6, 10, 0.55)',
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.line,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sheetTitle: {
    color: colors.text,
    fontFamily: fonts.sansSemibold,
    fontSize: 17,
  },
  reset: {
    color: colors.link,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.textFaint,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  years: {
    flexDirection: 'row',
    gap: 10,
  },
  yearInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    backgroundColor: colors.bg,
  },
  hint: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  done: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: colors.bg,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneText: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
});
