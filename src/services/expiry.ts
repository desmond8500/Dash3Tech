/**
 * Expiration des informations, calculée sur l'heure du serveur
 * (décalage mesuré à chaque synchronisation) pour ne pas dépendre
 * de l'horloge du téléphone.
 */

let serverOffsetMs = 0;

export function setServerTime(serverIso: string, receivedAt = Date.now()) {
  const server = Date.parse(serverIso);
  if (!Number.isNaN(server)) serverOffsetMs = server - receivedAt;
}

export function setServerOffset(offset: number) {
  serverOffsetMs = offset;
}

export function getServerOffset(): number {
  return serverOffsetMs;
}

export function serverNow(): number {
  return Date.now() + serverOffsetMs;
}

export function isExpired(expiresAt: string | null | undefined, now = serverNow()): boolean {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  return !Number.isNaN(t) && t <= now;
}

/** Durée restante lisible : « 3 j », « 5 h », « 12 min ». */
export function remaining(expiresAt: string | null | undefined, now = serverNow()): string {
  if (!expiresAt) return '';
  const ms = Date.parse(expiresAt) - now;
  if (ms <= 0) return 'expirée';
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${Math.max(min, 1)} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} j`;
}

/** Couleur Ionic selon l'urgence. */
export function urgency(expiresAt: string | null | undefined, now = serverNow()): 'danger' | 'warning' | 'medium' {
  if (!expiresAt) return 'medium';
  const h = (Date.parse(expiresAt) - now) / 3600000;
  if (h <= 6) return 'danger';
  if (h <= 24) return 'warning';
  return 'medium';
}

export function formatDate(iso: string | null | undefined, withTime = true): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}
