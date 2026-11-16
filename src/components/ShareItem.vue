<template>
  <ion-item :router-link="`/tabs/shares/${share.id}`" detail>
    <ion-icon slot="start" :icon="icon" :color="share.read_at ? 'medium' : 'primary'" />
    <ion-label>
      <h3 :class="{ unread: !share.read_at }">{{ share.title }}</h3>
      <p v-if="share.article">{{ share.article.designation }}<span v-if="share.article.reference"> · {{ share.article.reference }}</span></p>
      <p v-else-if="share.projet">{{ share.projet.name }}</p>
      <p><ExpiryBadge :expires-at="share.expires_at" /></p>
    </ion-label>
  </ion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon, IonItem, IonLabel } from '@ionic/vue';
import { cubeOutline, documentAttachOutline, informationCircleOutline, keyOutline } from 'ionicons/icons';
import ExpiryBadge from './ExpiryBadge.vue';
import type { Share } from '@/services/types';

const props = defineProps<{ share: Share }>();

const icon = computed(
  () =>
    ({
      info: informationCircleOutline,
      materiel: cubeOutline,
      acces: keyOutline,
      document: documentAttachOutline,
    })[props.share.category] ?? informationCircleOutline
);
</script>

<style scoped>
.unread {
  font-weight: 800;
}
</style>
