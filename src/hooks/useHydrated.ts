import { useEffect, useState } from 'react';

import { useFiltersStore } from '@/store/filters';
import { useSwipesStore } from '@/store/swipes';

export function useHydrated(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const finish = () => {
      if (
        useFiltersStore.persist.hasHydrated() &&
        useSwipesStore.persist.hasHydrated()
      ) {
        setReady(true);
      }
    };
    finish();
    const unsubscribeFilters = useFiltersStore.persist.onFinishHydration(finish);
    const unsubscribeSwipes = useSwipesStore.persist.onFinishHydration(finish);
    return () => {
      unsubscribeFilters();
      unsubscribeSwipes();
    };
  }, []);

  return ready;
}
