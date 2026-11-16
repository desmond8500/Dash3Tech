<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mes rapports</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/tabs/reports/new"><ion-icon slot="icon-only" :icon="addOutline" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
      <SyncBar />
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-list v-if="reports.length">
        <ion-item v-for="r in reports" :key="r.client_uuid" :router-link="`/tabs/reports/${r.client_uuid}`" detail>
          <ion-label>
            <h3>{{ r.title }}</h3>
            <p v-if="r.task">{{ r.task }}</p>
            <p class="muted">
              {{ formatDate(r.reported_at || r.created_at) }}
              <span v-if="r.photos.length"> · {{ r.photos.length }} photo{{ r.photos.length > 1 ? 's' : '' }}</span>
            </p>
          </ion-label>
          <ion-badge slot="end" :color="reportStatus(r.status).color">{{ reportStatus(r.status).label }}</ion-badge>
        </ion-item>
      </ion-list>

      <div v-else class="empty">
        <p>Aucun rapport.</p>
        <ion-button router-link="/tabs/reports/new">Faire un rapport</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { addOutline } from 'ionicons/icons';
import SyncBar from '@/components/SyncBar.vue';
import { reports, syncNow } from '@/services/store';
import { formatDate } from '@/services/expiry';
import { reportStatus } from '@/services/labels';

async function refresh(ev: CustomEvent) {
  await syncNow();
  (ev.target as HTMLIonRefresherElement).complete();
}
</script>
