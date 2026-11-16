<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/requests" text="" /></ion-buttons>
        <ion-title>Nouvelle demande</ion-title>
      </ion-toolbar>
      <SyncBar />
    </ion-header>

    <ion-content>
      <form @submit.prevent="save">
        <ion-list inset>
          <ion-item>
            <ion-select v-model="taskId" label="Tâche concernée" label-placement="stacked" interface="action-sheet" placeholder="Aucune">
              <ion-select-option :value="null">Aucune</ion-select-option>
              <ion-select-option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-input v-model="subject" label="Information demandée" label-placement="stacked" placeholder="Ex. Plan électrique du niveau 1" required />
          </ion-item>
          <ion-item>
            <ion-textarea v-model="reason" label="Pourquoi ?" label-placement="stacked" auto-grow :rows="4" placeholder="Contexte, urgence…" />
          </ion-item>
        </ion-list>

        <div class="ion-padding">
          <ion-button type="submit" expand="block" :disabled="saving || !subject.trim()">Envoyer la demande</ion-button>
          <p class="muted">Hors ligne, la demande part automatiquement au retour du réseau.</p>
        </div>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import SyncBar from '@/components/SyncBar.vue';
import { createAccessRequest, tasks } from '@/services/store';

const route = useRoute();
const router = useRouter();

const taskId = ref<number | null>(route.query.task ? Number(route.query.task) : null);
const subject = ref('');
const reason = ref('');
const saving = ref(false);

async function save() {
  saving.value = true;
  try {
    await createAccessRequest({ subject: subject.value.trim(), reason: reason.value.trim(), task_id: taskId.value });
    router.replace('/tabs/requests');
  } finally {
    saving.value = false;
  }
}
</script>
