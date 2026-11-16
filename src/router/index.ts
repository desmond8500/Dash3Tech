import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import TabsPage from '@/views/TabsPage.vue';
import { isAuthenticated } from '@/services/auth';
import { setUnauthorizedHandler } from '@/services/api';
import { onSessionLost } from '@/services/store';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/tabs/tasks' },
  { path: '/login', component: () => import('@/pages/LoginPage.vue'), meta: { guest: true } },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      { path: '', redirect: '/tabs/tasks' },
      { path: 'tasks', component: () => import('@/pages/TasksPage.vue') },
      { path: 'tasks/:id', component: () => import('@/pages/TaskPage.vue') },
      { path: 'shares', component: () => import('@/pages/SharesPage.vue') },
      { path: 'shares/:id', component: () => import('@/pages/SharePage.vue') },
      { path: 'reports', component: () => import('@/pages/ReportsPage.vue') },
      { path: 'reports/new', component: () => import('@/pages/ReportFormPage.vue') },
      { path: 'reports/:uuid', component: () => import('@/pages/ReportPage.vue') },
      { path: 'requests', component: () => import('@/pages/AccessRequestsPage.vue') },
      { path: 'requests/new', component: () => import('@/pages/AccessRequestFormPage.vue') },
      { path: 'profile', component: () => import('@/pages/ProfilePage.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.guest) {
    return isAuthenticated() ? '/tabs/tasks' : true;
  }
  if (!isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  return true;
});

// 401 : accès retiré ou token révoqué → données locales effacées, retour à la connexion
setUnauthorizedHandler(() => {
  onSessionLost();
  if (router.currentRoute.value.path !== '/login') {
    router.replace({ path: '/login', query: { expired: '1' } });
  }
});

export default router;
