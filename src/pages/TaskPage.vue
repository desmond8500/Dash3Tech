<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/tasks" text="" /></ion-buttons>
        <ion-title>Tâche</ion-title>
      </ion-toolbar>
      <SyncBar />
    </ion-header>

    <ion-content v-if="task">
      <div class="card">
        <h2>{{ task.name }}</h2>
        <p v-if="task.projet" class="muted">{{ task.projet.name }}</p>
        <p v-if="place(task)">
          <ion-icon :icon="locationOutline" /> {{ place(task) }}
        </p>
        <p v-if="task.start_date || task.end_date" class="muted">
          {{ formatDate(task.start_date, false) }}<span v-if="task.end_date"> → {{ formatDate(task.end_date, false) }}</span>
        </p>
        <p v-if="task.priority" class="muted">Priorité : {{ task.priority }}</p>
        <p v-if="task.description" class="prewrap">{{ task.description }}</p>
      </div>

      <div class="section-title">Statut</div>
      <div class="card">
        <ion-segment :value="String(task.statut_id ?? '')" scrollable @ionChange="changeStatus">
          <ion-segment-button v-for="s in state.statuses" :key="s.id" :value="String(s.id)">
            <ion-label>{{ s.name }}</ion-label>
          </ion-segment-button>
        </ion-segment>
        <p v-if="statusPending" class="muted">Changement enregistré, envoi dès que possible.</p>
      </div>

      <template v-if="task.subtasks.length">
        <div class="section-title">Sous-tâches</div>
        <ion-list inset>
          <ion-item v-for="s in task.subtasks" :key="s.id">
            <ion-label>{{ s.name }}</ion-label>
          </ion-item>
        </ion-list>
      </template>

      <div class="section-title">Informations pour cette tâche</div>
      <ion-list v-if="taskShares.length" inset>
        <ShareItem v-for="s in taskShares" :key="s.id" :share="s" />
      </ion-list>
      <p v-else class="muted ion-padding-horizontal">Aucune information partagée.</p>

      <div class="ion-padding">
        <ion-button expand="block" :router-link="`/tabs/reports/new?task=${task.id}`">
          <ion-icon slot="start" :icon="documentTextOutline" /> Faire un rapport
        </ion-button>
        <ion-button expand="block" fill="outline" :router-link="`/tabs/requests/new?task=${task.id}`">
          <ion-icon slot="start" :icon="keyOutline" /> Demander une information
        </ion-button>
      </div>
    </ion-content>

    <ion-content v-else>
      <div class="empty">Cette tâche n'est plus disponible.</div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { documentTextOutline, keyOutline, locationOutline } from 'ionicons/icons';
import SyncBar from '@/components/SyncBar.vue';
import ShareItem from '@/components/ShareItem.vue';
import { findTask, setTaskStatus, shares, state } from '@/services/store';
import { formatDate } from '@/services/expiry';
import { place } from '@/services/tasks';

const route = useRoute();
const id = computed(() => Number(route.params.id));

const task = computed(() => findTask(id.value));
const taskShares = computed(() => shares.value.filter((s) => s.task_id === id.value));
const statusPending = computed(() =>
  state.outbox.some((i) => i.type === 'task_status' && i.payload.task_id === id.value)
);

function changeStatus(ev: CustomEvent) {
  const value = Number(ev.detail.value);
  if (task.value && value && value !== task.value.statut_id) {
    setTaskStatus(task.value.id, value);
  }
}
</script>
