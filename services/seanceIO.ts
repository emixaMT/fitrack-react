// services/seanceIO.ts
// Export et import de séances en JSON
import { supabase } from '../config/supabaseConfig';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export type SeanceExport = {
  version: 1;
  exportedAt: string;
  nom: string;
  category: string;
  objectifs?: { km?: number; vitesse?: number; denivele?: number } | null;
  exercices: { nom: string; series?: number | null; reps?: number | null; charge?: number | null }[];
};

/** Exporte une séance en JSON et ouvre le menu de partage */
export async function exportSeance(seanceId: string): Promise<void> {
  const { data, error } = await supabase
    .from('seances')
    .select('*')
    .eq('id', seanceId)
    .single();

  if (error || !data) {
    Alert.alert('Erreur', 'Séance introuvable.');
    return;
  }

  const exportData: SeanceExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    nom: data.nom ?? 'Sans titre',
    category: data.category ?? 'musculation',
    objectifs: data.objectifs ?? null,
    exercices: Array.isArray(data.exercices) ? data.exercices : [],
  };

  const json = JSON.stringify(exportData, null, 2);

  if (Platform.OS === 'web') {
    // Web: télécharger en fichier
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seance-${data.nom?.replace(/\s+/g, '-').toLowerCase() ?? 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Alert.alert('Export', 'Séance exportée en fichier JSON.');
    return;
  }

  // Mobile: utiliser Sharing
  const fs = await import('expo-file-system/legacy');
  const fileName = `seance-${data.nom?.replace(/\s+/g, '-').toLowerCase() ?? 'export'}.json`;
  const filePath = `${fs.cacheDirectory}${fileName}`;
  await fs.writeAsStringAsync(filePath, json, { encoding: fs.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Exporter la séance',
    });
  } else {
    Alert.alert('Export', 'Partage non disponible sur cet appareil.');
  }
}

/** Importe une séance depuis un objet JSON (validé) */
export async function importSeance(jsonString: string, userId: string): Promise<{ success: boolean; message: string }> {
  let parsed: SeanceExport;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, message: 'Fichier JSON invalide.' };
  }

  // Validation
  if (!parsed || typeof parsed !== 'object') {
    return { success: false, message: 'Format de séance invalide.' };
  }
  if (!parsed.nom || typeof parsed.nom !== 'string') {
    return { success: false, message: 'Nom de séance manquant.' };
  }
  if (!parsed.category || typeof parsed.category !== 'string') {
    return { success: false, message: 'Catégorie manquante.' };
  }
  if (!Array.isArray(parsed.exercices)) {
    return { success: false, message: 'Exercices invalides.' };
  }

  // Validation des exercices
  for (const exo of parsed.exercices) {
    if (typeof exo.nom !== 'string') {
      return { success: false, message: 'Exercice avec nom invalide.' };
    }
  }

  try {
    const { error } = await supabase.from('seances').insert({
      id_user: userId,
      nom: parsed.nom,
      category: parsed.category,
      objectifs: parsed.objectifs ?? null,
      exercices: parsed.exercices,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, message: 'Erreur lors de l\'import en base.' };
    }

    return { success: true, message: `Séance "${parsed.nom}" importée avec succès.` };
  } catch {
    return { success: false, message: 'Erreur lors de l\'import.' };
  }
}

/** Lit un fichier JSON depuis le système de fichiers (mobile) */
export async function readJsonFile(uri: string): Promise<string> {
  const fs = await import('expo-file-system/legacy');
  return await fs.readAsStringAsync(uri, { encoding: fs.EncodingType.UTF8 });
}
