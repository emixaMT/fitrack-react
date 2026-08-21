// constants/workoutTemplates.ts
import { SportKey } from './sport';

export interface WorkoutTemplate {
  id: string;
  name: string;
  category: SportKey;
  type: string; // Force, Hypertrophie, Endurance, Fractionné, etc.
  description: string;
  duration: string; // ex: "45 min"
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  exercices?: { nom: string; series: number; reps: number; charge: number | null }[];
  objectifs?: { km: string; vitesse: string; denivele: string; duree?: string };
}

export const workoutTemplates: WorkoutTemplate[] = [
  // ============ MUSCULATION ============
  {
    id: 'musc-force-5x5',
    name: 'Force 5x5',
    category: 'musculation',
    type: 'Force',
    description: 'Programme de force basique. 5 séries de 5 reps sur les mouvements principaux.',
    duration: '60 min',
    difficulty: 'Intermédiaire',
    exercices: [
      { nom: 'Squat', series: 5, reps: 5, charge: null },
      { nom: 'Développé couché', series: 5, reps: 5, charge: null },
      { nom: 'Soulevé de terre', series: 1, reps: 5, charge: null },
      { nom: 'Rowing barre', series: 5, reps: 5, charge: null },
    ],
  },
  {
    id: 'musc-hypertrophie-ppl',
    name: 'Hypertrophie Push',
    category: 'musculation',
    type: 'Hypertrophie',
    description: 'Session push : pecs, épaules, triceps. Volume modéré, repos courts.',
    duration: '50 min',
    difficulty: 'Intermédiaire',
    exercices: [
      { nom: 'Développé couché', series: 4, reps: 8, charge: null },
      { nom: 'Développé militaire', series: 4, reps: 8, charge: null },
      { nom: 'Écarté haltères', series: 3, reps: 12, charge: null },
      { nom: 'Élévations latérales', series: 3, reps: 15, charge: null },
      { nom: 'Extension triceps poulie', series: 3, reps: 12, charge: null },
      { nom: 'Dips', series: 3, reps: 10, charge: null },
    ],
  },
  {
    id: 'musc-hypertrophie-pull',
    name: 'Hypertrophie Pull',
    category: 'musculation',
    type: 'Hypertrophie',
    description: 'Session pull : dos, biceps. Tirage vertical et horizontal.',
    duration: '50 min',
    difficulty: 'Intermédiaire',
    exercices: [
      { nom: 'Tractions', series: 4, reps: 8, charge: null },
      { nom: 'Rowing barre', series: 4, reps: 8, charge: null },
      { nom: 'Tirage vertical poulie', series: 3, reps: 12, charge: null },
      { nom: 'Rowing haltère', series: 3, reps: 10, charge: null },
      { nom: 'Curl biceps barre', series: 3, reps: 12, charge: null },
      { nom: 'Curl marteau', series: 3, reps: 12, charge: null },
    ],
  },
  {
    id: 'musc-hypertrophie-legs',
    name: 'Hypertrophie Legs',
    category: 'musculation',
    type: 'Hypertrophie',
    description: 'Session jambes : quadriceps, ischios, fessiers, mollets.',
    duration: '55 min',
    difficulty: 'Intermédiaire',
    exercices: [
      { nom: 'Squat', series: 4, reps: 8, charge: null },
      { nom: 'Presse à cuisses', series: 4, reps: 12, charge: null },
      { nom: 'Fentes marchées', series: 3, reps: 10, charge: null },
      { nom: 'Hip Thrust', series: 4, reps: 10, charge: null },
      { nom: 'Leg curl', series: 3, reps: 12, charge: null },
      { nom: 'Mollets debout', series: 4, reps: 15, charge: null },
    ],
  },
  {
    id: 'musc-fullbody',
    name: 'Full Body',
    category: 'musculation',
    type: 'Full Body',
    description: 'Entraînement complet du corps en une session. Idéal pour débutants.',
    duration: '45 min',
    difficulty: 'Débutant',
    exercices: [
      { nom: 'Squat', series: 3, reps: 10, charge: null },
      { nom: 'Développé couché', series: 3, reps: 10, charge: null },
      { nom: 'Rowing barre', series: 3, reps: 10, charge: null },
      { nom: 'Développé militaire', series: 3, reps: 10, charge: null },
      { nom: 'Curl biceps', series: 2, reps: 12, charge: null },
      { nom: 'Extension triceps', series: 2, reps: 12, charge: null },
    ],
  },
  {
    id: 'musc-upper-lower',
    name: 'Upper Body',
    category: 'musculation',
    type: 'Upper/Lower',
    description: 'Session haut du corps : pecs, dos, épaules, bras.',
    duration: '50 min',
    difficulty: 'Intermédiaire',
    exercices: [
      { nom: 'Développé couché', series: 4, reps: 8, charge: null },
      { nom: 'Tractions', series: 4, reps: 8, charge: null },
      { nom: 'Développé militaire', series: 3, reps: 10, charge: null },
      { nom: 'Rowing haltère', series: 3, reps: 10, charge: null },
      { nom: 'Curl biceps', series: 3, reps: 12, charge: null },
      { nom: 'Extension triceps', series: 3, reps: 12, charge: null },
    ],
  },

  // ============ CROSSFIT / HYROX ============
  {
    id: 'crossfit-wod-amrap',
    name: 'WOD AMRAP 20',
    category: 'crossfit',
    type: 'AMRAP',
    description: '20 min AMRAP : 5 thrusters, 10 burpees, 15 double-unders.',
    duration: '25 min',
    difficulty: 'Avancé',
    exercices: [
      { nom: 'Thrusters', series: 5, reps: 10, charge: null },
      { nom: 'Burpees', series: 10, reps: 1, charge: null },
      { nom: 'Double-unders', series: 15, reps: 1, charge: null },
    ],
  },
  {
    id: 'crossfit-hyrox',
    name: 'Hyrox Simulation',
    category: 'crossfit',
    type: 'Hyrox',
    description: 'Simulation Hyrox : 8 stations de functional fitness + 8x1km running.',
    duration: '75 min',
    difficulty: 'Avancé',
    exercices: [
      { nom: 'Sled push', series: 1, reps: 50, charge: null },
      { nom: 'Burpee broad jumps', series: 1, reps: 50, charge: null },
      { nom: 'Wall balls', series: 1, reps: 50, charge: null },
      { nom: 'Sled pull', series: 1, reps: 50, charge: null },
      { nom: 'Rowing machine', series: 1, reps: 1000, charge: null },
      { nom: 'Kettlebell carry', series: 1, reps: 100, charge: null },
      { nom: 'Lunges', series: 1, reps: 100, charge: null },
      { nom: 'Kettlebell push press', series: 1, reps: 75, charge: null },
    ],
  },
  {
    id: 'crossfit-emom',
    name: 'EMOM 15',
    category: 'crossfit',
    type: 'EMOM',
    description: '15 min EMOM : alterne 10 kettlebell swings et 10 box jumps.',
    duration: '20 min',
    difficulty: 'Intermédiaire',
    exercices: [
      { nom: 'Kettlebell swing', series: 10, reps: 1, charge: null },
      { nom: 'Box jump', series: 10, reps: 1, charge: null },
    ],
  },
  {
    id: 'crossfit-chipper',
    name: 'Chipper',
    category: 'crossfit',
    type: 'Chipper',
    description: 'WOD chipper : 21-15-9 thrusters et pull-ups.',
    duration: '30 min',
    difficulty: 'Avancé',
    exercices: [
      { nom: 'Thrusters', series: 21, reps: 15, charge: null },
      { nom: 'Pull-ups', series: 21, reps: 15, charge: null },
    ],
  },

  // ============ RUNNING ============
  {
    id: 'running-endurance',
    name: 'Endurance fondamentale',
    category: 'running',
    type: 'Endurance',
    description: 'Sortie longue à allure facile (zone 2). Développe la base aérobie.',
    duration: '60 min',
    difficulty: 'Débutant',
    objectifs: { km: '10', vitesse: '10 km/h', denivele: '50', duree: '60 min' },
  },
  {
    id: 'running-fractionne',
    name: 'Fractionné 400m',
    category: 'running',
    type: 'Fractionné',
    description: '10x400m avec 60s récup. Développe la VMA.',
    duration: '40 min',
    difficulty: 'Avancé',
    objectifs: { km: '6', vitesse: '15 km/h', denivele: '0', duree: '40 min' },
  },
  {
    id: 'running-tempo',
    name: 'Allure tempo',
    category: 'running',
    type: 'Tempo',
    description: '20 min échauffement + 20 min à allure tempo (seuil) + 10 min retour.',
    duration: '50 min',
    difficulty: 'Intermédiaire',
    objectifs: { km: '8', vitesse: '12 km/h', denivele: '100', duree: '50 min' },
  },
  {
    id: 'running-longue',
    name: 'Longue sortie',
    category: 'running',
    type: 'Endurance',
    description: 'Sortie longue 15km pour préparer un semi-marathon.',
    duration: '90 min',
    difficulty: 'Intermédiaire',
    objectifs: { km: '15', vitesse: '11 km/h', denivele: '200', duree: '90 min' },
  },
  {
    id: 'running-hill',
    name: 'Côtes',
    category: 'running',
    type: 'Hill repeats',
    description: '8x200m en côte avec descente en trottinant. Force et puissance.',
    duration: '45 min',
    difficulty: 'Avancé',
    objectifs: { km: '5', vitesse: '13 km/h', denivele: '300', duree: '45 min' },
  },

  // ============ VELO ============
  {
    id: 'velo-endurance',
    name: 'Endurance zone 2',
    category: 'velo',
    type: 'Endurance',
    description: 'Sortie plate à endurance fondamentale. Base aérobie.',
    duration: '90 min',
    difficulty: 'Débutant',
    objectifs: { km: '40', vitesse: '25 km/h', denivele: '100', duree: '90 min' },
  },
  {
    id: 'velo-seuil',
    name: 'Intervalles seuil',
    category: 'velo',
    type: 'Intervalles',
    description: '4x10 min à allure seuil avec 5 min récup. Développe le FTP.',
    duration: '75 min',
    difficulty: 'Avancé',
    objectifs: { km: '35', vitesse: '28 km/h', denivele: '200', duree: '75 min' },
  },
  {
    id: 'velo-cotes',
    name: 'Sortie montagne',
    category: 'velo',
    type: 'Côtes',
    description: 'Sortie vallonnée avec 3 cols. Dénivelé important.',
    duration: '120 min',
    difficulty: 'Avancé',
    objectifs: { km: '50', vitesse: '22 km/h', denivele: '1200', duree: '120 min' },
  },
  {
    id: 'velo-sprint',
    name: 'Sprint intervals',
    category: 'velo',
    type: 'Sprint',
    description: '10x30s sprint max avec 4min30 récup. Puissance anaérobie.',
    duration: '60 min',
    difficulty: 'Avancé',
    objectifs: { km: '25', vitesse: '30 km/h', denivele: '50', duree: '60 min' },
  },
];

export function getTemplatesByCategory(category: SportKey): WorkoutTemplate[] {
  return workoutTemplates.filter((t) => t.category === category);
}
