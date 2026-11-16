import type { Task } from './types';

/** Statut Dash3 « Terminé » (1 Nouveau, 2 En cours, 3 En pause, 4 Terminé, 5 Clôturé). */
export const DONE_STATUS = 4;

export function statusColor(statutId: number | null): string {
  switch (statutId) {
    case 1:
      return 'primary';
    case 2:
      return 'warning';
    case 3:
      return 'medium';
    case 4:
    case 5:
      return 'success';
    default:
      return 'light';
  }
}

/** Lieu d'intervention : client · bâtiment · niveau · pièce. */
export function place(task: Task): string {
  return [task.client?.name, task.building?.name, task.stage?.name, task.room?.name].filter(Boolean).join(' · ');
}
