import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultFilters } from '@/lib/filters';
import type { Filters } from '@/model';

type FiltersState = {
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  toggleGenre: (genreId: number) => void;
  reset: () => void;
};

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      setFilters: (patch) =>
        set((state) => ({ filters: { ...state.filters, ...patch } })),
      toggleGenre: (genreId) =>
        set((state) => {
          const has = state.filters.genreIds.includes(genreId);
          const genreIds = has
            ? state.filters.genreIds.filter((id) => id !== genreId)
            : [...state.filters.genreIds, genreId];
          return { filters: { ...state.filters, genreIds } };
        }),
      reset: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'kinotinder-filters',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ filters: state.filters }),
    },
  ),
);
