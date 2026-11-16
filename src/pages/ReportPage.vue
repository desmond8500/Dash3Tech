<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/reports" text="" /></ion-buttons>
        <ion-title>Rapport</ion-title>
      </ion-toolbar>
      <SyncBar />
    </ion-header>

    <ion-content v-if="report">
      <div class="card">
        <ion-badge :color="reportStatus(report.status).color">{{ reportStatus(report.status).label }}</ion-badge>
        <h2 class="ion-margin-top">{{ report.title }}</h2>
        <p v-if="report.task" class="muted">Tâche : {{ report.task }}</p>
        <p class="muted">{{ formatDate(report.reported_at || report.created_at) }}</p>
        <p v-if="report.latitude && report.longitude" class="muted">
          Position : {{ report.latitude.toFixed(5) }}, {{ report.longitude.toFixed(5) }}
        </p>
      </div>

      <div v-if="report.content" class="card prewrap">{{ report.content }}</div>

      <div v-if="report.review_note" class="card review">
        <strong>Retour du responsable</strong>
        <p class="prewrap">{{ report.review_note }}</p>
      </div>

      <template v-if="report.photos.length">
        <div class="section-title">Photos ({{ report.photos.length }})</div>
        <div class="card">
          <div v-if="localPhotos.length" class="photo-grid">
            <div v-for="p in localPhotos" :key="p.id" class="thumb"><img :src="p.url" alt="" /></div>
          </div>
          <p v-else class="muted">{{ report.photos.length }} photo(s) envoyée(s) à Dash3.</p>
        </div>
      </template>

      <div v-if="failed" class="card review">
        <strong>Envoi refusé par le serveur</strong>
        <p>{{ failed.lastError }}</p>
        <ion-button color="danger" fill="outline" @click="discard">Supprimer ce rapport du téléphone</ion-button>
      </div>
    </ion-content>

    <ion-content v-else>
      <div class="empty">Rapport introuvable.</div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  alertController,
} from '@ionic/vue';
import SyncBar from '@/components/SyncBar.vue';
import { discardOutboxItem, pendingPhotoBlobs, reports, state } from '@/services/store';
import { formatDate } from '@/services/expiry';
import { reportStatus } from '@/services/labels';

const route = useRoute();
const router = useRouter();
const uuid = computed(() => String(route.params.uuid));

const report = computed(() => reports.value.find((r) => r.client_uuid === uuid.value));
const failed = computed(() => state.outbox.find((i) => i.id === uuid.value && i.lastError));

// Aperçu des photos encore sur le téléphone
const localPhotos = ref<{ id: string; url: string }[]>([]);
let urls: string[] = []; // non réactif : évite que l'effet se relance lui-même
watchEffect(() => {
  urls.forEach((u) => URL.revokeObjectURL(u));
  const items = pendingPhotoBlobs(uuid.value).map((p) => ({ id: p.id, url: URL.createObjectURL(p.blob) }));
  urls = items.map((i) => i.url);
  localPhotos.value = items;
});
onBeforeUnmount(() => urls.forEach((u) => URL.revokeObjectURL(u)));

async function discard() {
  const alert = await alertController.create({
    header: 'Supprimer ce rapport ?',
    message: 'Il n\'a pas été accepté par Dash3 et sera effacé du téléphone, photos comprises.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: async () => {
          await discardOutboxItem(uuid.value);
          router.replace('/tabs/reports');
        },
      },
    ],
  });
  await alert.present();
}
</script>

<style scoped>
.review {
  border-left: 4px solid var(--ion-color-warning);
}
</style>
