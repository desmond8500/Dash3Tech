import { computed, reactive } from 'vue';
import api, { errorMessage, get, isNetworkError, patch, post } from './api';
import { clearSession, setSession, storedUser } from './auth';
import { kv, outbox, wipeLocalData, type OutboxItem } from './db';
import { getServerOffset, isExpired, setServerOffset, setServerTime } from './expiry';
import { uuid } from './uuid';
import type { AccessRequest, Report, Share, Snapshot, Status, Task, TechUser } from './types';

/**
 * État de l'application, persistant hors ligne.
 *
 * - Les données viennent d'un instantané complet (`GET /tech/sync`) qui
 *   remplace le cache local : ce qui a expiré ou a été retiré côté Dash3
 *   disparaît du téléphone à la synchronisation suivante.
 * - Les informations dont la date est passée sont aussi purgées localement,
 *   même sans réseau (vérification chaque minute).
 * - Rapports, photos, demandes et changements de statut faits hors ligne
 *   vont dans une file d'attente envoyée dès que le réseau revient.
 */

interface CachedSnapshot {
  snapshot: Omit<Snapshot, 'server_time'>;
  lastSync: number;
  serverOffset: number;
}

export const state = reactive({
  ready: false,
  user: storedUser() as TechUser | null,
  statuses: [] as Status[],
  tasks: [] as Task[],
  shares: [] as Share[],
  reports: [] as Report[],
  accessRequests: [] as AccessRequest[],
  outbox: [] as OutboxItem[],
  idMap: {} as Record<string, number>, // client_uuid du rapport → id serveur
  lastSync: null as number | null,
  syncing: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  lastError: null as string | null,
});

// ------------------------------------------------------------------ Lecture

/** Tâches avec les changements de statut pas encore envoyés. */
export const tasks = computed<Task[]>(() => {
  const pendingStatus = new Map<number, number>();
  for (const item of state.outbox) {
    if (item.type === 'task_status') pendingStatus.set(item.payload.task_id, item.payload.statut_id);
  }
  return state.tasks.map((t) => {
    const s = pendingStatus.get(t.id);
    if (s === undefined) return t;
    return { ...t, statut_id: s, statut: state.statuses.find((x) => x.id === s)?.name ?? t.statut };
  });
});

export const shares = computed<Share[]>(() => state.shares);

/** Rapports envoyés + rapports en attente d'envoi (en tête). */
export const reports = computed<Report[]>(() => {
  const pending: Report[] = state.outbox
    .filter((i) => i.type === 'report')
    .map((i) => ({
      id: null,
      client_uuid: i.id,
      task_id: i.payload.task_id ?? null,
      task: state.tasks.find((t) => t.id === i.payload.task_id)?.name ?? null,
      projet_id: null,
      title: i.payload.title,
      content: i.payload.content ?? null,
      status: 'pending',
      latitude: i.payload.latitude ?? null,
      longitude: i.payload.longitude ?? null,
      reported_at: i.payload.reported_at ?? null,
      review_note: null,
      reviewed_at: null,
      photos: photosFor(i.id),
      author: null,
      created_at: new Date(i.createdAt).toISOString(),
    }));
  return [...pending, ...state.reports];
});

export const accessRequests = computed<AccessRequest[]>(() => {
  const queued: AccessRequest[] = state.outbox
    .filter((i) => i.type === 'access_request')
    .map((i) => ({
      id: null,
      client_uuid: i.id,
      subject: i.payload.subject,
      reason: i.payload.reason ?? null,
      task_id: i.payload.task_id ?? null,
      projet_id: null,
      article_id: i.payload.article_id ?? null,
      status: 'queued',
      response: null,
      decided_at: null,
      tech_share_id: null,
      requester: null,
      created_at: new Date(i.createdAt).toISOString(),
    }));
  return [...queued, ...state.accessRequests];
});

export const pendingCount = computed(() => state.outbox.length);
export const failedItems = computed(() => state.outbox.filter((i) => i.lastError));
export const unreadShares = computed(() => state.shares.filter((s) => !s.read_at).length);

function photosFor(reportUuid: string) {
  return state.outbox
    .filter((i) => i.type === 'photo' && i.payload.report_uuid === reportUuid)
    .map((i) => ({ id: null, client_uuid: i.id, caption: i.payload.caption ?? null }));
}

/** Photos en attente d'un rapport (aperçu local). */
export function pendingPhotoBlobs(reportUuid: string): { id: string; blob: Blob; caption: string | null }[] {
  return state.outbox
    .filter((i) => i.type === 'photo' && i.payload.report_uuid === reportUuid && i.blob)
    .map((i) => ({ id: i.id, blob: i.blob as Blob, caption: i.payload.caption ?? null }));
}

export function findTask(id: number) {
  return tasks.value.find((t) => t.id === id);
}

export function findShare(id: number) {
  return state.shares.find((s) => s.id === id);
}

// -------------------------------------------------------- Initialisation

let started = false;

export async function initStore() {
  if (started) return;
  started = true;

  try {
    const cached = await kv.get<CachedSnapshot>('snapshot');
    if (cached) {
      setServerOffset(cached.serverOffset);
      applySnapshot(cached.snapshot);
      state.lastSync = cached.lastSync;
    }
    state.idMap = (await kv.get<Record<string, number>>('idmap')) ?? {};
    state.outbox = await outbox.all();
  } catch (e) {
    console.error('Lecture du cache local impossible', e);
  }

  purgeExpired();
  state.ready = true;

  window.addEventListener('online', () => {
    state.online = true;
    syncNow();
  });
  window.addEventListener('offline', () => {
    state.online = false;
  });

  setInterval(purgeExpired, 60_000);
  setInterval(() => syncNow(), 5 * 60_000);
}

function applySnapshot(s: Omit<Snapshot, 'server_time'>) {
  state.user = s.user;
  state.statuses = s.statuses;
  state.tasks = s.tasks;
  state.shares = s.shares.filter((x) => !isExpired(x.expires_at));
  state.reports = s.reports;
  state.accessRequests = s.access_requests;
}

async function persist() {
  const snapshot: CachedSnapshot = {
    snapshot: {
      user: state.user as TechUser,
      statuses: state.statuses,
      tasks: state.tasks,
      shares: state.shares,
      reports: state.reports,
      access_requests: state.accessRequests,
    },
    lastSync: state.lastSync ?? Date.now(),
    serverOffset: getServerOffset(),
  };
  // Copie simple : IndexedDB n'accepte pas les proxys réactifs
  await kv.set('snapshot', JSON.parse(JSON.stringify(snapshot)));
}

/** Retire du téléphone les informations dont la date d'expiration est passée. */
export function purgeExpired() {
  const before = state.shares.length;
  state.shares = state.shares.filter((s) => !isExpired(s.expires_at));
  if (state.shares.length !== before && state.user) persist();
}

// --------------------------------------------------------------- Session

export async function login(email: string, password: string) {
  const { data } = await api.post('/login', { email, password, device_name: 'dash3-tech' });
  setSession(data.token, data.user);

  try {
    await get('/tech/me');
  } catch (e: any) {
    if (e?.response?.status === 403) {
      await api.post('/logout').catch(() => undefined);
      clearSession();
      throw new Error('Ce compte n\'a pas accès à Dash3Tech. Demandez un compte technicien.');
    }
    throw e;
  }

  // Autre compte que le précédent sur ce téléphone : on repart de zéro
  const cached = await kv.get<CachedSnapshot>('snapshot');
  if (cached && cached.snapshot.user?.id !== data.user.id) {
    await wipeLocalData();
    resetState();
  }

  state.user = data.user;
  await syncNow();
}

export async function logout() {
  try {
    await api.post('/logout');
  } catch {
    // hors ligne : le token sera de toute façon oublié sur le téléphone
  }
  clearSession();
  await wipeLocalData();
  resetState();
}

/** Appelé quand le serveur répond 401 (accès retiré, token révoqué). */
export async function onSessionLost() {
  await wipeLocalData();
  resetState();
}

function resetState() {
  state.user = null;
  state.statuses = [];
  state.tasks = [];
  state.shares = [];
  state.reports = [];
  state.accessRequests = [];
  state.outbox = [];
  state.idMap = {};
  state.lastSync = null;
  state.lastError = null;
}

// ---------------------------------------------------------- Synchronisation

export async function syncNow(): Promise<boolean> {
  if (state.syncing || !state.user) return false;
  state.syncing = true;
  state.lastError = null;

  try {
    await flushOutbox();
    const requestedAt = Date.now();
    const snap = await get<Snapshot>('/tech/sync');
    setServerTime(snap.server_time, Math.round((requestedAt + Date.now()) / 2));
    applySnapshot(snap);
    state.lastSync = Date.now();
    state.online = true;
    await persist();
    return true;
  } catch (e) {
    if (isNetworkError(e)) state.online = false;
    state.lastError = errorMessage(e);
    return false;
  } finally {
    state.syncing = false;
  }
}

async function flushOutbox() {
  const items = await outbox.all();

  for (const item of items) {
    try {
      const done = await send(item);
      if (done) {
        await outbox.delete(item.id);
        state.outbox = state.outbox.filter((i) => i.id !== item.id);
      }
    } catch (e: any) {
      if (isNetworkError(e) || (e?.response?.status ?? 0) >= 500 || e?.response?.status === 429) {
        throw e; // on réessaiera plus tard, dans l'ordre
      }
      // Refus du serveur (validation, accès retiré…) : on garde l'élément, marqué en erreur
      item.attempts += 1;
      item.lastError = errorMessage(e);
      await outbox.put(item);
      state.outbox = state.outbox.map((i) => (i.id === item.id ? { ...item } : i));
    }
  }
}

/** Envoie une action. Renvoie false si elle doit attendre (photo d'un rapport pas encore envoyé). */
async function send(item: OutboxItem): Promise<boolean> {
  switch (item.type) {
    case 'report': {
      const report = await post<Report>('/tech/reports', { client_uuid: item.id, ...item.payload });
      if (report.id) {
        state.idMap[item.id] = report.id;
        await kv.set('idmap', { ...state.idMap });
      }
      return true;
    }
    case 'photo': {
      const reportId = state.idMap[item.payload.report_uuid];
      if (!reportId) return false;
      const form = new FormData();
      form.append('photo', item.blob as Blob, `${item.id}.jpg`);
      form.append('client_uuid', item.id);
      if (item.payload.caption) form.append('caption', item.payload.caption);
      await post(`/tech/reports/${reportId}/photos`, form);
      return true;
    }
    case 'access_request':
      await post('/tech/access-requests', { client_uuid: item.id, ...item.payload });
      return true;
    case 'task_status':
      await patch(`/tech/tasks/${item.payload.task_id}/status`, { statut_id: item.payload.statut_id });
      return true;
  }
}

async function enqueue(type: OutboxItem['type'], payload: Record<string, any>, blob?: Blob, id = uuid()) {
  const item: OutboxItem = { id, type, payload, blob, createdAt: Date.now(), attempts: 0 };
  await outbox.put(item);
  state.outbox = [...state.outbox, item];
  return item;
}

/** Supprime une action en erreur que le serveur refuse. */
export async function discardOutboxItem(id: string) {
  await outbox.delete(id);
  state.outbox = state.outbox.filter((i) => i.id !== id && i.payload.report_uuid !== id);
  for (const i of await outbox.all()) {
    if (i.payload.report_uuid === id) await outbox.delete(i.id);
  }
}

// ---------------------------------------------------------------- Actions

export async function setTaskStatus(taskId: number, statutId: number) {
  // Un seul changement en attente par tâche : le dernier l'emporte
  for (const i of state.outbox.filter((x) => x.type === 'task_status' && x.payload.task_id === taskId)) {
    await outbox.delete(i.id);
  }
  state.outbox = state.outbox.filter((x) => !(x.type === 'task_status' && x.payload.task_id === taskId));
  await enqueue('task_status', { task_id: taskId, statut_id: statutId });
  syncNow();
}

export interface NewReport {
  task_id: number | null;
  title: string;
  content: string;
  latitude: number | null;
  longitude: number | null;
  photos: { blob: Blob; caption: string | null }[];
}

export async function createReport(r: NewReport) {
  const reportId = uuid();
  await enqueue(
    'report',
    {
      task_id: r.task_id,
      title: r.title,
      content: r.content,
      latitude: r.latitude,
      longitude: r.longitude,
      reported_at: new Date().toISOString(),
    },
    undefined,
    reportId
  );
  for (const p of r.photos) {
    await enqueue('photo', { report_uuid: reportId, caption: p.caption }, p.blob);
  }
  syncNow();
  return reportId;
}

export async function createAccessRequest(payload: { subject: string; reason: string; task_id: number | null }) {
  await enqueue('access_request', payload);
  syncNow();
}

/** Marque une information comme lue et récupère sa version à jour (si en ligne). */
export async function openShare(id: number): Promise<Share | undefined> {
  try {
    const fresh = await get<Share>(`/tech/shares/${id}`);
    state.shares = state.shares.map((s) => (s.id === id ? fresh : s));
    persist();
    return fresh;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      // Expirée ou retirée entre-temps
      state.shares = state.shares.filter((s) => s.id !== id);
      persist();
      return undefined;
    }
    return findShare(id);
  }
}

/** Télécharge la pièce jointe (en ligne uniquement : elle n'est pas gardée sur le téléphone). */
export async function downloadShareFile(share: Share): Promise<void> {
  const res = await api.get(`/tech/shares/${share.id}/file`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = share.file_name || `information-${share.id}`;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
