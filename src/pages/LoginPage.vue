<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="login">
        <h1>Dash3Tech</h1>
        <p class="muted">Espace technicien</p>

        <ion-note v-if="route.query.expired" color="warning" class="notice">
          Votre session a pris fin. Reconnectez-vous.
        </ion-note>

        <form @submit.prevent="submit">
          <ion-list inset>
            <ion-item>
              <ion-input v-model="email" type="email" label="E-mail" label-placement="stacked" autocomplete="username" required />
            </ion-item>
            <ion-item>
              <ion-input v-model="password" type="password" label="Mot de passe" label-placement="stacked" autocomplete="current-password" required>
                <ion-input-password-toggle slot="end" />
              </ion-input>
            </ion-item>
          </ion-list>

          <ion-note v-if="error" color="danger" class="notice">{{ error }}</ion-note>

          <ion-button type="submit" expand="block" class="ion-margin-top" :disabled="loading">
            <ion-spinner v-if="loading" name="crescent" />
            <span v-else>Se connecter</span>
          </ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonItem,
  IonList,
  IonNote,
  IonPage,
  IonSpinner,
} from '@ionic/vue';
import { login } from '@/services/store';
import { errorMessage } from '@/services/api';

const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await login(email.value.trim(), password.value);
    password.value = '';
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/tabs/tasks';
    router.replace(redirect);
  } catch (e: any) {
    error.value = e instanceof Error && !(e as any).isAxiosError ? e.message : errorMessage(e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login {
  max-width: 420px;
  margin: 12vh auto 0;
}
h1 {
  font-weight: 800;
  color: var(--ion-color-primary);
  text-align: center;
  margin-bottom: 0;
}
.login > .muted {
  text-align: center;
  margin-top: 4px;
}
.notice {
  display: block;
  margin: 12px 16px;
}
</style>
