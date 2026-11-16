<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Demandes d'accès</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/tabs/requests/new"><ion-icon slot="icon-only" :icon="addOutline" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
      <SyncBar />
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <p class="muted ion-padding-horizontal hint">
        Besoin d'un plan, d'un code, d'une fiche matériel ? Faites une demande : si elle est acceptée,
        l'information apparaît dans « Infos » pour une durée limitée.
      </p>

      <ion-list v-if="accessRequests.length" inset>
        <ion-item v-for="r in accessRequests" :key="r.client_uuid" :button="!!r.tech_share_id" @click="open(r)">
          <ion-label class="ion-text-wrap">
            <h3>{{ r.subject }}</h3>
            <p v-if="taskName(r.task_id)">{{ taskName(r.task_id) }}</p>
            <p v-if="r.reason" class="muted">{{ r.reason }}</p>
            <p v-if="r.response" class="response">Réponse : {{ r.response }}</p>
            <p class="muted">{{ formatDate(r.created_at) }}</p>
          </ion-label>
          <ion-badge slot="end" :color="requestStatus(r.status).color">{{ requestStatus(r.status).label }}</ion-badge>
        </ion-item>
      </ion-list>

      <div v-else class="empty">
        <p>Aucune demande.</p>
        <ion-button router-link="/tabs/requests/new">Faire une demande</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
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
import { accessRequests, findShare, findTask, syncNow } from '@/services/store';
import { formatDate } from '@/services/expiry';
import { requestStatus } from '@/services/labels';
import type { AccessRequest } from '@/services/types';

const router = useRouter();

function taskName(id: number | null) {
  return id ? findTask(id)?.name : undefined;
}

/** Demande acceptée : ouvre l'information accordée tant qu'elle est valide. */
function open(r: AccessRequest) {
  if (r.tech_share_id && findShare(r.tech_share_id)) {
    router.push(`/tabs/shares/${r.tech_share_id}`);
  }
}

async function refresh(ev: CustomEvent) {
  await syncNow();
  (ev.target as HTMLIonRefresherElement).complete();
}
</script>

<style scoped>
.hint {
  margin-top: 12px;
}
.response {
  color: var(--ion-color-primary);
}
</style>
