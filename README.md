# Dash3Tech

Application mobile des techniciens sur site, liée à **Dash3**. Construite avec Vue 3, Ionic 9 et Capacitor 8 (la même stack que Dash3 Mobile).

## Fonctionnalités

| Onglet | Ce que fait le technicien |
|---|---|
| **Tâches** | voit les tâches qui lui sont affectées (lieu, dates, sous-tâches) et change leur statut : Nouveau, En cours, En pause, Terminé |
| **Infos** | consulte les informations temporaires partagées avec lui : fiches matériel, accès, documents, consignes. Un compte à rebours indique leur expiration |
| **Rapports** | rédige un rapport d'intervention, avec photos et position GPS facultative |
| **Demandes** | demande l'accès à une information. Si la demande est acceptée, l'information apparaît dans « Infos » pour une durée limitée |
| **Profil** | consulte l'état de la synchronisation et les envois en attente ou refusés, et se déconnecte |

### Comptes limités

Un compte technicien a uniquement le rôle `technicien` dans Dash3. Il n'a accès qu'à l'API `/api/v1/tech/*` : ni ERP, ni stock, ni devis, et **jamais de prix**. Si un compte sans ce rôle se connecte, il est refusé.

### Informations temporaires

- Chaque information a une date d'expiration, et/ou expire avec la clôture de la tâche liée.
- L'auteur reçoit une notification dans Dash3 **avant l'expiration** (24 h par défaut), ce qui lui laisse le temps de prolonger.
- À l'échéance, Dash3 purge le contenu et le fichier joint. Le téléphone efface aussi l'information de son cache, **même hors ligne**. L'heure utilisée est celle du serveur, pour que changer l'horloge du téléphone ne prolonge rien.
- Les pièces jointes ne s'ouvrent qu'en ligne et ne sont pas gardées sur le téléphone.

### Hors ligne

- Tâches, informations, rapports et demandes sont gardés dans IndexedDB.
- Rapports, photos (compressées à 1600 px), demandes et changements de statut faits sans réseau sont mis en file d'attente. Ils sont envoyés dans l'ordre au retour du réseau, au retour de l'app au premier plan et toutes les 5 minutes.
- Chaque envoi porte un identifiant unique (`client_uuid`) : un renvoi après une coupure ne crée pas de doublon.
- La déconnexion, ou un accès retiré par l'administrateur (401), efface toutes les données locales.

## Côté Dash3

Il faut la branche `feature/techniciens` du repo Dash3 : migrations, rôle `technicien`, API, commande `tech:expire-shares`. Voir `docs/21_Techniciens.md` dans Dash3.

```bash
php artisan migrate
# planificateur (cron) pour les alertes et la purge :
* * * * * cd /chemin/dash3 && php artisan schedule:run >> /dev/null 2>&1
```

## Développement

```bash
cp .env.example .env        # VITE_API_URL=https://…/api/v1
npm install
npm run dev
npm run test:unit
npm run build
npx cap add android         # première fois
npx cap sync android && npx cap open android
```

Pour le GPS sur Android, ajoutez `ACCESS_FINE_LOCATION` dans `android/app/src/main/AndroidManifest.xml` après `cap add android`.

## Structure

```
src/
  services/
    api.ts       client axios (token Sanctum, 401 → déconnexion)
    auth.ts      session
    db.ts        IndexedDB : cache + file d'attente
    store.ts     état, synchronisation, actions hors ligne
    expiry.ts    expiration calée sur l'heure serveur
    images.ts    compression photo, GPS
  pages/         Tâches, Infos, Rapports, Demandes, Profil, Connexion
  components/    SyncBar, ExpiryBadge, ShareItem
```
