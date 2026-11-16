<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mes tâches</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="filter">
          <ion-segment-button value="todo"><ion-label>À faire ({{ todo.length }})</ion-label></ion-segment-button>
          <ion-segment-button value="done"><ion-label>Terminées</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
      <SyncBar />
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-list v-if="visible.length">
        <ion-item v-for="task in visible" :key="task.id" :router-link="`/tabs/tasks/${task.id}`" detail>
          <ion-label>
            <h3>{{ task.name }}</h3>
            <p v-if="place(task)">{{ place(task) }}</p>
            <p v-if="task.start_date || task.end_date" class="muted">
              {{ formatDate(task.start_date, false) }}<span v-if="task.end_date"> → {{ formatDate(task.end_date, false) }}</span>
            </p>
          </ion-label>
          <div slot="end" class="end">
            <ion-badge :color="statusColor(task.statut_id)">{{ task.statut || '—' }}</ion-badge>
            <ion-badge v-if="sharesCount(task.id)" color="light">
              <ion-icon :icon="informationCircleOutline" /> {{ sharesCount(task.id) }}
            </ion-badge>
          </div>
        </ion-item>
      </ion-list>

      <div v-else class="empty">
        <p v-if="!state.lastSync && !state.online">Pas encore de données : connectez-vous au réseau une première fois.</p>
        <p v-else>{{ filter === 'todo' ? 'Aucune tâche à faire.' : 'Aucune tâche terminée.' }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonBadge,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { informationCircleOutline } from 'ionicons/icons';
import SyncBar from '@/components/SyncBar.vue';
import { shares, state, syncNow, tasks } from '@/services/store';
import { formatDate } from '@/services/expiry';
import { place, statusColor, DONE_STATUS } from '@/services/tasks';
import type { Task } from '@/services/types';

const filter = ref<'todo' | 'done'>('todo');

const todo = computed(() => tasks.value.filter((t) => (t.statut_id ?? 0) < DONE_STATUS));
const done = computed(() => tasks.value.filter((t) => (t.statut_id ?? 0) >= DONE_STATUS));
const visible = computed<Task[]>(() => (filter.value === 'todo' ? todo.value : done.value));

function sharesCount(taskId: number) {
  return shares.value.filter((s) => s.task_id === taskId).length;
}

async function refresh(ev: CustomEvent) {
  await syncNow();
  (ev.target as HTMLIonRefresherElement).complete();
}
</script>

<style scoped>
.end {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
</style>
