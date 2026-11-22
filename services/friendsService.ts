// services/friendsService.ts
// Gestion des amis et du classement
import { supabase } from '../config/supabaseConfig';

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export type Friend = {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  status: FriendStatus;
  level: number;
  totalXP: number;
  badgeCount: number;
  monthlySessions: number;
  /** true si la demande en attente a été reçue (et peut donc être acceptée) */
  incoming?: boolean;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  photoURL?: string | null;
  level: number;
  totalXP: number;
  badgeCount: number;
  monthlySessions: number;
  rank: number;
};

/** Shape of a public.users row used for friends display */
interface FriendUserRow {
  id: string;
  name: string | null;
  email: string | null;
  photo_url?: string | null;
  photoURL?: string | null;
  monthly_sessions?: number | null;
}

/** Shape of a friends relation row */
interface FriendRelationRow {
  user_id: string;
  friend_id: string;
  status: FriendStatus;
}

/** Résultat des RPC find_user_by_friend_code / find_user_by_email */
interface FoundUserRow {
  id: string;
  name: string | null;
}

/** Shape of a user_levels row used for the leaderboard */
interface UserLevelRow {
  user_id: string;
  level: number;
  total_xp: number;
}

/** Shape of a user_badges row used for counting badges per user */
interface UserBadgeCountRow {
  user_id: string;
}

/** Génère un code ami aléatoire de 8 caractères si l'utilisateur n'en a pas */
export async function getMyFriendCode(userId: string): Promise<string> {
  // Vérifier si l'utilisateur a déjà un code
  const { data } = await supabase
    .from('users')
    .select('friend_code')
    .eq('id', userId)
    .maybeSingle();

  if (data?.friend_code) return data.friend_code;

  // Générer un code unique
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  // Tenter l'update, retry si collision
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase
      .from('users')
      .update({ friend_code: code })
      .eq('id', userId)
      .is('friend_code', null);

    if (!error) return code;

    // Régénérer un autre code
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return code;
}

/** Ajoute un ami par son code ami */
export async function addFriendByCode(userId: string, friendCode: string): Promise<{ success: boolean; message: string }> {
  const code = friendCode.trim().toUpperCase();

  if (!code || code.length !== 8) {
    return { success: false, message: 'Code invalide (8 caractères).' };
  }

  // Trouver l'utilisateur par son code
  const { data: found, error: findError } = await supabase
    .rpc('find_user_by_friend_code', { p_code: code });
  const targetUser = (found as FoundUserRow[] | null)?.[0];

  if (findError || !targetUser) {
    return { success: false, message: 'Aucun utilisateur avec ce code.' };
  }

  if (targetUser.id === userId) {
    return { success: false, message: 'C\'est ton propre code !' };
  }

  // Vérifier si une relation existe déjà
  const { data: existing } = await supabase
    .from('friends')
    .select('id, status')
    .or(pairFilter(userId, targetUser.id))
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') {
      return { success: false, message: 'Vous êtes déjà amis.' };
    }
    return { success: false, message: 'Demande déjà envoyée.' };
  }

  const { error } = await supabase
    .from('friends')
    .insert({ user_id: userId, friend_id: targetUser.id, status: 'pending' });

  if (error) {
    return { success: false, message: 'Erreur lors de l\'envoi de la demande.' };
  }

  return { success: true, message: `Demande envoyée à ${targetUser.name ?? 'l\'utilisateur'}.` };
}

/** Filtre PostgREST ciblant la relation entre deux utilisateurs, dans les deux sens */
function pairFilter(a: string, b: string): string {
  return `and(user_id.eq.${a},friend_id.eq.${b}),and(user_id.eq.${b},friend_id.eq.${a})`;
}

/** Récupère la liste d'amis (acceptés + en attente) */
export async function getFriends(userId: string): Promise<{ friends: Friend[]; pending: Friend[] }> {
  // 1. Relations où l'utilisateur est impliqué (dans un sens ou dans l'autre)
  const { data: relations, error: relError } = await supabase
    .from('friends')
    .select('user_id, friend_id, status')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (relError || !relations?.length) return { friends: [], pending: [] };

  const rows = relations as FriendRelationRow[];
  const otherIds = Array.from(new Set(rows.map(r => (r.user_id === userId ? r.friend_id : r.user_id))));

  // 2. Profils des autres utilisateurs (la RLS n'autorise que les personnes liées)
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, photo_url, photoURL, monthly_sessions')
    .in('id', otherIds);

  const userMap = new Map<string, FriendUserRow>();
  ((users ?? []) as FriendUserRow[]).forEach(u => userMap.set(u.id, u));

  const friends: Friend[] = [];
  const pending: Friend[] = [];

  for (const r of rows) {
    const incoming = r.friend_id === userId;
    const otherId = incoming ? r.user_id : r.friend_id;
    const u = userMap.get(otherId);

    const friend: Friend = {
      id: otherId,
      name: u?.name ?? u?.email?.split('@')[0] ?? 'Athlète',
      email: u?.email ?? '',
      photoURL: u?.photo_url ?? u?.photoURL ?? null,
      status: r.status,
      level: 0, // Enrichi via getLeaderboard
      totalXP: 0,
      badgeCount: 0,
      monthlySessions: u?.monthly_sessions ?? 0,
      incoming,
    };

    if (r.status === 'accepted') friends.push(friend);
    else if (r.status === 'pending') pending.push(friend);
  }

  return { friends, pending };
}

/** Envoie une demande d'amitié par email */
export async function sendFriendRequest(userId: string, friendEmail: string): Promise<{ success: boolean; message: string }> {
  // Trouver l'utilisateur par email
  const { data: found, error: findError } = await supabase
    .rpc('find_user_by_email', { p_email: friendEmail.trim().toLowerCase() });
  const targetUser = (found as FoundUserRow[] | null)?.[0];

  if (findError || !targetUser) {
    return { success: false, message: 'Utilisateur introuvable.' };
  }

  if (targetUser.id === userId) {
    return { success: false, message: 'Tu ne peux pas t\'ajouter toi-même.' };
  }

  // Vérifier si une relation existe déjà
  const { data: existing } = await supabase
    .from('friends')
    .select('id, status')
    .or(pairFilter(userId, targetUser.id))
    .maybeSingle();

  if (existing) {
    return { success: false, message: 'Demande déjà envoyée ou ami déjà ajouté.' };
  }

  const { error } = await supabase
    .from('friends')
    .insert({ user_id: userId, friend_id: targetUser.id, status: 'pending' });

  if (error) {
    return { success: false, message: 'Erreur lors de l\'envoi de la demande.' };
  }

  return { success: true, message: 'Demande d\'ami envoyée.' };
}

/** Accepte une demande d'amitié */
export async function acceptFriendRequest(userId: string, friendId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('user_id', friendId)
    .eq('friend_id', userId)
    .eq('status', 'pending')
    .select('id');

  return !error && (data?.length ?? 0) > 0;
}

/** Supprime un ami */
export async function removeFriend(userId: string, friendId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('friends')
    .delete()
    .or(pairFilter(userId, friendId))
    .select('id');

  return !error && (data?.length ?? 0) > 0;
}

/** Récupère le classement (amis + soi-même) par niveau XP */
export async function getLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  const { friends } = await getFriends(userId);

  // Récupérer les badges count pour chaque ami
  const friendIds = friends.map(f => f.id);
  friendIds.push(userId);

  const { data: badgeCounts } = await supabase
    .from('user_badges')
    .select('user_id')
    .in('user_id', friendIds);

  const badgeCountMap: Record<string, number> = {};
  (badgeCounts || []).forEach((b: UserBadgeCountRow) => {
    badgeCountMap[b.user_id] = (badgeCountMap[b.user_id] ?? 0) + 1;
  });

  // Niveaux / XP (lisibles pour soi et les amis acceptés)
  const { data: levels } = await supabase
    .from('user_levels')
    .select('user_id, level, total_xp')
    .in('user_id', friendIds);

  const levelMap: Record<string, UserLevelRow> = {};
  ((levels ?? []) as UserLevelRow[]).forEach(l => { levelMap[l.user_id] = l; });

  // Construire les entrées du classement
  const entries: LeaderboardEntry[] = [];

  // Ajouter l'utilisateur courant
  const { data: me } = await supabase
    .from('users')
    .select('name, email, photo_url, photoURL, monthly_sessions')
    .eq('id', userId)
    .maybeSingle();

  if (me) {
    entries.push({
      id: userId,
      name: me.name ?? me.email?.split('@')[0] ?? 'Moi',
      photoURL: me.photo_url ?? me.photoURL ?? null,
      level: levelMap[userId]?.level ?? 1,
      totalXP: levelMap[userId]?.total_xp ?? 0,
      badgeCount: badgeCountMap[userId] ?? 0,
      monthlySessions: me.monthly_sessions ?? 0,
      rank: 0,
    });
  }

  // Ajouter les amis
  for (const f of friends) {
    entries.push({
      id: f.id,
      name: f.name,
      photoURL: f.photoURL,
      level: levelMap[f.id]?.level ?? 1,
      totalXP: levelMap[f.id]?.total_xp ?? 0,
      badgeCount: badgeCountMap[f.id] ?? 0,
      monthlySessions: f.monthlySessions,
      rank: 0,
    });
  }

  // Trier par badges puis par sessions mensuelles
  entries.sort((a, b) => {
    if (b.badgeCount !== a.badgeCount) return b.badgeCount - a.badgeCount;
    return b.monthlySessions - a.monthlySessions;
  });

  // Assigner les rangs
  entries.forEach((e, i) => { e.rank = i + 1; });

  return entries;
}
