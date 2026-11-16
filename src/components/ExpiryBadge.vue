<template>
  <ion-badge v-if="expiresAt" :color="color" class="expiry">
    <ion-icon :icon="timeOutline" /> {{ label }}
  </ion-badge>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { IonBadge, IonIcon } from '@ionic/vue';
import { timeOutline } from 'ionicons/icons';
import { remaining, serverNow, urgency } from '@/services/expiry';

const props = defineProps<{ expiresAt: string | null; withTask?: boolean }>();

// Rafraîchit le compte à rebours chaque minute
const now = ref(serverNow());
const timer = setInterval(() => (now.value = serverNow()), 60_000);
onBeforeUnmount(() => clearInterval(timer));

const color = computed(() => urgency(props.expiresAt, now.value));
const label = computed(() => {
  const r = remaining(props.expiresAt, now.value);
  return r === 'expirée' ? r : `expire dans ${r}`;
});
</script>

<style scoped>
.expiry {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}
</style>
