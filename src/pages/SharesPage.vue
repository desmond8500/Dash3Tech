<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Informations</ion-title>
      </ion-toolbar>
      <SyncBar />
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <p class="muted ion-padding-horizontal hint">
        Ces informations sont temporaires : elles disparaissent du téléphone à leur expiration.
      </p>

      <template v-for="group in groups" :key="group.key">
        <div v-if="group.items.length" class="section-title">{{ group.label }}</div>
        <ion-list v-if="group.items.length" inset>
          <ShareItem v-for="s in group.items" :key="s.id" :share="s" />
        </ion-list>
      </template>

      <div v-if="!shares.length" class="empty">Aucune information partagée pour le moment.</div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IonContent,
  IonHeader,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import SyncBar from '@/components/SyncBar.vue';
import ShareItem from '@/components/ShareItem.vue';
import { shares, syncNow } from '@/services/store';

const groups = computed(() => [
  { key: 'materiel', label: 'Matériel', items: shares.value.filter((s) => s.category === 'materiel') },
  { key: 'acces', label: 'Accès accordés', items: shares.value.filter((s) => s.category === 'acces') },
  { key: 'info', label: 'Informations', items: shares.value.filter((s) => s.category === 'info') },
  { key: 'document', label: 'Documents', items: shares.value.filter((s) => s.category === 'document') },
]);

async function refresh(ev: CustomEvent) {
  await syncNow();
  (ev.target as HTMLIonRefresherElement).complete();
}
</script>

<style scoped>
.hint {
  margin-top: 12px;
}
</style>
