<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/shares" text="" /></ion-buttons>
        <ion-title>Information</ion-title>
      </ion-toolbar>
      <SyncBar />
    </ion-header>

    <ion-content v-if="share">
      <div class="card">
        <h2>{{ share.title }}</h2>
        <p><ExpiryBadge :expires-at="share.expires_at" /></p>
        <p class="muted">
          Disponible jusqu'au {{ formatDate(share.expires_at) }}
          <span v-if="share.expires_with_task"> (ou à la fin de la tâche)</span>
        </p>
        <p v-if="share.author" class="muted">Partagée par {{ share.author }}</p>
        <p v-if="task" class="muted">
          Tâche : <router-link :to="`/tabs/tasks/${task.id}`">{{ task.name }}</router-link>
        </p>
        <p v-if="share.projet" class="muted">Projet : {{ share.projet.name }}</p>
        <p v-if="share.building" class="muted">Bâtiment : {{ share.building.name }}</p>
      </div>

      <div v-if="share.content" class="card prewrap">{{ share.content }}</div>

      <template v-if="share.article">
        <div class="section-title">Matériel</div>
        <div class="card article">
          <img v-if="share.article.image" :src="share.article.image" alt="" />
          <div>
            <h2>{{ share.article.designation }}</h2>
            <p v-if="share.article.reference" class="muted">Réf. {{ share.article.reference }}</p>
            <p v-if="share.article.brand" class="muted">{{ share.article.brand }}</p>
          </div>
        </div>
        <div v-if="share.article.description" class="card prewrap">{{ share.article.description }}</div>
        <div v-if="share.article.spec" class="card">
          <strong>Caractéristiques</strong>
          <p class="prewrap">{{ share.article.spec }}</p>
        </div>
      </template>

      <div v-if="share.has_file" class="ion-padding">
        <ion-button expand="block" fill="outline" :disabled="!state.online || downloading" @click="download">
          <ion-icon slot="start" :icon="downloadOutline" />
          {{ share.file_name || 'Pièce jointe' }}
        </ion-button>
        <p v-if="!state.online" class="muted">La pièce jointe s'ouvre uniquement en ligne.</p>
        <p v-if="error" class="muted">{{ error }}</p>
      </div>
    </ion-content>

    <ion-content v-else>
      <div class="empty">Cette information a expiré ou n'est plus partagée avec vous.</div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { downloadOutline } from 'ionicons/icons';
import SyncBar from '@/components/SyncBar.vue';
import ExpiryBadge from '@/components/ExpiryBadge.vue';
import { downloadShareFile, findShare, findTask, openShare, state } from '@/services/store';
import { errorMessage } from '@/services/api';
import { formatDate } from '@/services/expiry';

const route = useRoute();
const id = computed(() => Number(route.params.id));

// Lue depuis l'état : si elle expire pendant la lecture, la page se vide d'elle-même
const share = computed(() => findShare(id.value));
const task = computed(() => (share.value?.task_id ? findTask(share.value.task_id) : undefined));

const downloading = ref(false);
const error = ref('');

onMounted(() => {
  if (state.online) openShare(id.value);
});

async function download() {
  if (!share.value) return;
  downloading.value = true;
  error.value = '';
  try {
    await downloadShareFile(share.value);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    downloading.value = false;
  }
}
</script>

<style scoped>
.article {
  display: flex;
  gap: 12px;
  align-items: center;
}
.article img {
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 10px;
  background: #fff;
}
</style>
