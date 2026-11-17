import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { MovieCard, Swipe, SwipeDirection } from '@/model';

type SwipesState = {
  swipes: Swipe[];
  /** Снимок карточки, чтобы «на вечер» открывался без нового запроса. */
  cards: Record<number, MovieCard>;
  swipe: (movie: MovieCard, direction: SwipeDirection) => void;
  /** Убираем из вечера и помечаем «уже видел» — в колоду не вернётся. */
  removeFromEvening: (movieId: number) => void;
};

export const useSwipesStore = create<SwipesState>()(
  persist(
    (set) => ({
      swipes: [],
      cards: {},
      swipe: (movie, direction) =>
        set((state) => {
          const swipes = state.swipes.filter((item) => item.movieId !== movie.id);
          swipes.push({ movieId: movie.id, direction });
          return {
            swipes,
            cards: { ...state.cards, [movie.id]: movie },
          };
        }),
      removeFromEvening: (movieId) =>
        set((state) => ({
          swipes: state.swipes.map((item) =>
            item.movieId === movieId && item.direction === 'like'
              ? { ...item, direction: 'seen' as const }
              : item,
          ),
        })),
    }),
    {
      name: 'kinotinder-swipes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ swipes: state.swipes, cards: state.cards }),
    },
  ),
);
