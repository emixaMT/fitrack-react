// src/constants/sports.ts
export type SportKey = 'musculation' | 'crossfit' | 'running' | 'velo';

export const sportsMeta: Record<SportKey, {
  label: string;
  icon: any;     // Ionicons name si tu veux, ou PNG
  image: any;    // require vers ton PNG
}> = {
  musculation: {
    label: 'Musculation',
    icon: 'barbell-outline',
    image: require('../src/assets/musculation.png'),
  },
  crossfit: {
    label: 'Crossfit',
    icon: 'fitness-outline',
    image: require('../src/assets/crossfit.png'),
  },
  running: {
    label: 'Course',
    icon: 'walk-outline',
    image: require('../src/assets/running.png'),
  },
  velo: {
    label: 'Vélo',
    icon: 'bicycle-outline',
    image: require('../src/assets/velo.png'),
  },
};
