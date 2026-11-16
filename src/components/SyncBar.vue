<template>
  <div v-if="!state.online || pendingCount || state.syncing" class="sync-bar" :class="tone">
    <ion-icon :icon="icon" />
    <span>{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon } from '@ionic/vue';
import { cloudOfflineOutline, cloudUploadOutline, syncOutline } from 'ionicons/icons';
import { pendingCount, state } from '@/services/store';

const tone = computed(() => (!state.online ? 'offline' : state.syncing ? 'syncing' : 'pending'));

const icon = computed(() => (!state.online ? cloudOfflineOutline : state.syncing ? syncOutline : cloudUploadOutline));

const text = computed(() => {
  const n = pendingCount.value;
  const wait = n ? ` · ${n} élément${n > 1 ? 's' : ''} à envoyer` : '';
  if (!state.online) return `Hors ligne${wait}`;
  if (state.syncing) return 'Synchronisation…';
  return `${n} élément${n > 1 ? 's' : ''} en attente d'envoi`;
});
</script>

<style scoped>
.sync-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  font-size: 0.85rem;
  font-weight: 600;
}
.offline {
  background: var(--ion-color-medium);
  color: #fff;
}
.syncing {
  background: var(--ion-color-primary-tint);
  color: #fff;
}
.pending {
  background: var(--ion-color-warning);
  color: var(--ion-color-warning-contrast);
}
</style>
