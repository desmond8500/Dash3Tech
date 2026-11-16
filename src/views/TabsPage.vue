<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tasks" href="/tabs/tasks">
          <ion-icon :icon="clipboardOutline" />
          <ion-label>Tâches</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="shares" href="/tabs/shares">
          <ion-icon :icon="informationCircleOutline" />
          <ion-label>Infos</ion-label>
          <ion-badge v-if="unreadShares" color="danger">{{ unreadShares }}</ion-badge>
        </ion-tab-button>

        <ion-tab-button tab="reports" href="/tabs/reports">
          <ion-icon :icon="documentTextOutline" />
          <ion-label>Rapports</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="requests" href="/tabs/requests">
          <ion-icon :icon="keyOutline" />
          <ion-label>Demandes</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="personCircleOutline" />
          <ion-label>Profil</ion-label>
          <ion-badge v-if="pendingCount" color="warning">{{ pendingCount }}</ion-badge>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonBadge, IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue';
import {
  clipboardOutline,
  documentTextOutline,
  informationCircleOutline,
  keyOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { pendingCount, unreadShares } from '@/services/store';
</script>
