<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Profil</ion-title>
      </ion-toolbar>
      <SyncBar />
    </ion-header>

    <ion-content>
      <div v-if="state.user" class="card">
        <h2>{{ state.user.firstname }} {{ state.user.lastname }}</h2>
        <p class="muted">{{ state.user.email }}</p>
        <p v-if="state.user.function" class="muted">{{ state.user.function }}</p>
      </div>

      <div class="section-title">Synchronisation</div>
      <ion-list inset>
        <ion-item>
          <ion-label>Réseau</ion-label>
          <ion-badge slot="end" :color="state.online ? 'success' : 'medium'">{{ state.online ? 'En ligne' : 'Hors ligne' }}</ion-badge>
        </ion-item>
        <ion-item>
          <ion-label>Dernière synchronisation</ion-label>
          <ion-note slot="end">{{ state.lastSync ? formatDate(new Date(state.lastSync).toISOString()) : 'jamais' }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label>En attente d'envoi</ion-label>
          <ion-note slot="end">{{ pendingCount }}</ion-note>
        </ion-item>
        <ion-item v-if="state.lastError">
          <ion-label color="danger" class="ion-text-wrap">{{ state.lastError }}</ion-label>
        </ion-item>
      </ion-list>
      <div class="ion-padding-horizontal">
        <ion-button expand="block" :disabled="state.syncing" @click="syncNow()">
          <ion-icon slot="start" :icon="syncOutline" /> Synchroniser maintenant
        </ion-button>
      </div>

      <template v-if="failedItems.length">
        <div class="section-title">Envois refusés</div>
        <ion-list inset>
          <ion-item v-for="i in failedItems" :key="i.id">
            <ion-label class="ion-text-wrap">
              <h3>{{ describe(i) }}</h3>
              <p>{{ i.lastError }}</p>
            </ion-label>
            <ion-button slot="end" fill="clear" color="danger" @click="discardOutboxItem(i.id)">
              <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-button>
          </ion-item>
        </ion-list>
      </template>

      <div class="ion-padding">
        <ion-button expand="block" color="danger" fill="outline" @click="confirmLogout">
          <ion-icon slot="start" :icon="logOutOutline" /> Se déconnecter
        </ion-button>
        <p class="muted">La déconnexion efface toutes les données gardées sur ce téléphone.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  alertController,
} from '@ionic/vue';
import { logOutOutline, syncOutline, trashOutline } from 'ionicons/icons';
import SyncBar from '@/components/SyncBar.vue';
import { discardOutboxItem, failedItems, logout, pendingCount, state, syncNow } from '@/services/store';
import { formatDate } from '@/services/expiry';
import type { OutboxItem } from '@/services/db';

const router = useRouter();

function describe(i: OutboxItem): string {
  switch (i.type) {
    case 'report':
      return `Rapport « ${i.payload.title} »`;
    case 'photo':
      return 'Photo de rapport';
    case 'access_request':
      return `Demande « ${i.payload.subject} »`;
    case 'task_status':
      return `Statut de la tâche #${i.payload.task_id}`;
  }
}

async function confirmLogout() {
  const n = pendingCount.value;
  const alert = await alertController.create({
    header: 'Se déconnecter ?',
    message: n
      ? `${n} élément${n > 1 ? 's' : ''} n'${n > 1 ? 'ont' : 'a'} pas encore été envoyé${n > 1 ? 's' : ''} et ser${n > 1 ? 'ont' : 'a'} perdu${n > 1 ? 's' : ''}. Synchronisez d'abord si possible.`
      : 'Les données gardées sur ce téléphone seront effacées.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'Se déconnecter',
        role: 'destructive',
        handler: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ],
  });
  await alert.present();
}
</script>
