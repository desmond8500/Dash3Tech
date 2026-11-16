export function reportStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'pending':
      return { label: 'À envoyer', color: 'warning' };
    case 'submitted':
      return { label: 'Envoyé', color: 'primary' };
    case 'validated':
      return { label: 'Validé', color: 'success' };
    case 'rejected':
      return { label: 'À revoir', color: 'danger' };
    default:
      return { label: status, color: 'medium' };
  }
}

export function requestStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'queued':
      return { label: 'À envoyer', color: 'warning' };
    case 'pending':
      return { label: 'En attente', color: 'primary' };
    case 'approved':
      return { label: 'Acceptée', color: 'success' };
    case 'rejected':
      return { label: 'Refusée', color: 'danger' };
    default:
      return { label: status, color: 'medium' };
  }
}
