import { describe, expect, it } from 'vitest';
import { isExpired, remaining, setServerTime, serverNow, urgency } from '@/services/expiry';

const NOW = Date.parse('2026-11-16T12:00:00Z');
const at = (hours: number) => new Date(NOW + hours * 3600_000).toISOString();

describe('expiration des informations', () => {
  it('considère expirée une date passée ou atteinte', () => {
    expect(isExpired(at(-1), NOW)).toBe(true);
    expect(isExpired(at(0), NOW)).toBe(true);
    expect(isExpired(at(1), NOW)).toBe(false);
    expect(isExpired(null, NOW)).toBe(false);
  });

  it('affiche la durée restante', () => {
    expect(remaining(at(0.2), NOW)).toBe('12 min');
    expect(remaining(at(5), NOW)).toBe('5 h');
    expect(remaining(at(72), NOW)).toBe('3 j');
    expect(remaining(at(-1), NOW)).toBe('expirée');
  });

  it('signale l\'urgence', () => {
    expect(urgency(at(2), NOW)).toBe('danger');
    expect(urgency(at(12), NOW)).toBe('warning');
    expect(urgency(at(48), NOW)).toBe('medium');
  });

  it('se cale sur l\'heure du serveur, pas sur celle du téléphone', () => {
    const phone = Date.now();
    setServerTime(new Date(phone + 3600_000).toISOString(), phone); // téléphone en retard d'1 h
    expect(Math.abs(serverNow() - (Date.now() + 3600_000))).toBeLessThan(1000);
    setServerTime(new Date().toISOString());
  });
});
