// FILE: hooks/useWeightHistory.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

type WeightEntry = { date: Date; value: number };

/**
 * Why: attendre l'init Auth avant de lire Firestore, éviter currentUser undefined.
 */
export function useWeightHistory(): WeightEntry[] {
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  useEffect(() => {
    let unsubFS: undefined | (() => void);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // stop previous FS listener on user change
      if (unsubFS) {
        unsubFS();
        unsubFS = undefined;
      }

      if (!user) {
        setWeights([]);
        return;
      }

      const q = query(
        collection(db, 'Poids', user.uid, 'entries'),
        orderBy('date', 'asc')
      );

      unsubFS = onSnapshot(q, (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data() as any;
          const date =
            typeof data?.date?.toDate === 'function'
              ? data.date.toDate()
              : new Date(data?.date ?? Date.now());
          const value =
            typeof data?.value === 'number' ? data.value : Number(data?.value);
          return { date, value };
        });
        setWeights(items);
      });
    });

    return () => {
      unsubAuth();
      if (unsubFS) unsubFS();
    };
  }, []);

  return weights;
}
