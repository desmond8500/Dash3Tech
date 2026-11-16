<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/reports" text="" /></ion-buttons>
        <ion-title>Nouveau rapport</ion-title>
      </ion-toolbar>
      <SyncBar />
    </ion-header>

    <ion-content>
      <form @submit.prevent="save">
        <ion-list inset>
          <ion-item>
            <ion-select v-model="taskId" label="Tâche" label-placement="stacked" interface="action-sheet" placeholder="Sans tâche">
              <ion-select-option :value="null">Sans tâche</ion-select-option>
              <ion-select-option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-input v-model="title" label="Titre" label-placement="stacked" placeholder="Ex. Pose des détecteurs, niveau 2" required />
          </ion-item>
          <ion-item>
            <ion-textarea
              v-model="content"
              label="Compte rendu"
              label-placement="stacked"
              auto-grow
              :rows="6"
              placeholder="Travaux réalisés, matériel posé, problèmes rencontrés, suite à donner…"
            />
          </ion-item>
          <ion-item>
            <ion-toggle v-model="withGps" justify="space-between">Joindre ma position</ion-toggle>
          </ion-item>
        </ion-list>

        <div class="section-title">Photos</div>
        <div class="card">
          <div class="photo-grid">
            <div v-for="(p, i) in photos" :key="p.url" class="thumb">
              <img :src="p.url" alt="" />
              <ion-button class="remove" size="small" color="dark" @click="removePhoto(i)">
                <ion-icon slot="icon-only" :icon="closeOutline" />
              </ion-button>
            </div>
          </div>
          <ion-button expand="block" fill="outline" class="ion-margin-top" @click="picker?.click()">
            <ion-icon slot="start" :icon="cameraOutline" /> Ajouter des photos
          </ion-button>
          <input ref="picker" type="file" accept="image/*" capture="environment" multiple hidden @change="addPhotos" />
        </div>

        <ion-note v-if="error" color="danger" class="ion-padding">{{ error }}</ion-note>

        <div class="ion-padding">
          <ion-button type="submit" expand="block" :disabled="saving || !title.trim()">
            <ion-spinner v-if="saving" name="crescent" />
            <span v-else>Enregistrer le rapport</span>
          </ion-button>
          <p class="muted">
            Le rapport est gardé sur le téléphone et envoyé automatiquement dès que le réseau est disponible.
          </p>
        </div>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/vue';
import { cameraOutline, closeOutline } from 'ionicons/icons';
import SyncBar from '@/components/SyncBar.vue';
import { createReport, tasks } from '@/services/store';
import { compressImage, currentPosition } from '@/services/images';

const route = useRoute();
const router = useRouter();

const taskId = ref<number | null>(route.query.task ? Number(route.query.task) : null);
const title = ref('');
const content = ref('');
const withGps = ref(false);
const photos = ref<{ blob: Blob; url: string }[]>([]);
const picker = ref<HTMLInputElement | null>(null);
const saving = ref(false);
const error = ref('');

async function addPhotos(ev: Event) {
  const input = ev.target as HTMLInputElement;
  for (const file of Array.from(input.files ?? [])) {
    const blob = await compressImage(file);
    photos.value.push({ blob, url: URL.createObjectURL(blob) });
  }
  input.value = '';
}

function removePhoto(i: number) {
  URL.revokeObjectURL(photos.value[i].url);
  photos.value.splice(i, 1);
}

onBeforeUnmount(() => photos.value.forEach((p) => URL.revokeObjectURL(p.url)));

async function save() {
  error.value = '';
  saving.value = true;
  try {
    const pos = withGps.value ? await currentPosition() : null;
    const id = await createReport({
      task_id: taskId.value,
      title: title.value.trim(),
      content: content.value.trim(),
      latitude: pos?.latitude ?? null,
      longitude: pos?.longitude ?? null,
      photos: photos.value.map((p) => ({ blob: p.blob, caption: null })),
    });
    router.replace(`/tabs/reports/${id}`);
  } catch (e: any) {
    error.value = e?.message || 'Impossible d\'enregistrer le rapport.';
  } finally {
    saving.value = false;
  }
}
</script>
