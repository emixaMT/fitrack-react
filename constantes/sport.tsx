// src/constants/sports.ts
export type SportKey = 'musculation' | 'crossfit' | 'running' | 'velo';

export const sportsMeta: Record<SportKey, {
  label: string;
  icon: string;     // Ionicons name — monochrome flat
}> = {
  musculation: {
    label: 'Musculation',
    icon: 'barbell',
  },
  crossfit: {
    label: 'Crossfit',
    icon: 'flame',
  },
  running: {
    label: 'Course',
    icon: 'footsteps',
  },
  velo: {
    label: 'Vélo',
    icon: 'bicycle',
  },
};
