import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { App as CapApp } from '@capacitor/app';
import App from './App.vue';
import router from './router';
import { initStore, purgeExpired, syncNow } from './services/store';
import { isAuthenticated } from './services/auth';

/* CSS Ionic */
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';
import '@ionic/vue/css/palettes/dark.system.css';

import './theme/variables.css';
import './theme/app.css';

const app = createApp(App).use(IonicVue, { mode: 'ios' }).use(router);

initStore().then(() => {
  if (isAuthenticated()) syncNow();
});

// Retour au premier plan : purge des informations expirées puis synchronisation
CapApp.addListener('resume', () => {
  purgeExpired();
  if (isAuthenticated()) syncNow();
}).catch(() => undefined);

router.isReady().then(() => app.mount('#app'));
