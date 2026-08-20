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
  const { data: targetUser, error: findError } = await supabase
    .from('users')
    .select('id, name')
    .eq('friend_code', code)
    .maybeSingle();

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
    .or(`and(user_id.eq.${userId},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${userId})`)
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

/** Récupère la liste d'amis (acceptés + en attente) */
export async function getFriends(userId: string): Promise<{ friends: Friend[]; pending: Friend[] }> {
  // Récupérer les relations d'amitié où l'utilisateur est impliqué
  const { data: sent, error: err1 } = await supabase
    .from('friends')
    .select('friend_id, status, created_at, users:friend_id(id, name, email, photo_url, photoURL, monthly_sessions)')
    .eq('user_id', userId);

  const { data: received, error: err2 } = await supabase
    .from('friends')
    .select('user_id, status, created_at, users!friends_friend_id_fkey(id, name, email, photo_url, photoURL, monthly_sessions)')
    .eq('friend_id', userId);

  if (err1 && err2) return { friends: [], pending: [] };

  const friends: Friend[] = [];
  const pending: Friend[] = [];

  const processEntry = (entry: any, otherUserId: string, status: FriendStatus) => {
    if (!entry) return;
    const u = entry.users ?? entry;
    if (!u) return;

    const friend: Friend = {
      id: otherUserId,
      name: u.name ?? u.email?.split('@')[0] ?? 'Athlète',
      email: u.email ?? '',
      photoURL: u.photo_url ?? u.photoURL ?? null,
      status,
      level: 0, // Sera enrichi via getLeaderboard
      totalXP: 0,
      badgeCount: 0,
      monthlySessions: u.monthly_sessions ?? 0,
    };

    if (status === 'accepted') friends.push(friend);
    else if (status === 'pending') pending.push(friend);
  };

  (sent || []).forEach((s: any) => processEntry(s, s.friend_id, s.status as FriendStatus));
  (received || []).forEach((r: any) => processEntry(r, r.user_id, r.status as FriendStatus));

  return { friends, pending };
}

/** Envoie une demande d'amitié par email */
export async function sendFriendRequest(userId: string, friendEmail: string): Promise<{ success: boolean; message: string }> {
  // Trouver l'utilisateur par email
  const { data: targetUser, error: findError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', friendEmail.trim().toLowerCase())
    .maybeSingle();

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
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .or(`user_id.eq.${targetUser.id},friend_id.eq.${targetUser.id}`)
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
  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('user_id', friendId)
    .eq('friend_id', userId);

  return !error;
}

/** Supprime un ami */
export async function removeFriend(userId: string, friendId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`user_id.eq.${userId},friend_id.eq.${friendId}`)
    .or(`user_id.eq.${friendId},friend_id.eq.${userId}`);

  return !error;
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
  (badgeCounts || []).forEach((b: any) => {
    badgeCountMap[b.user_id] = (badgeCountMap[b.user_id] ?? 0) + 1;
  });

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
      level: 0,
      totalXP: 0,
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
      level: 0,
      totalXP: 0,
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
