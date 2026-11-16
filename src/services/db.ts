/**
 * Stockage local hors ligne (IndexedDB, disponible dans la WebView Capacitor).
 *  - « kv »     : cache des données (instantané de synchronisation)
 *  - « outbox » : actions faites hors ligne, à envoyer dès que le réseau revient
 */

const DB_NAME = 'dash3tech';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });

  return dbPromise;
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export const kv = {
  get<T>(key: string): Promise<T | undefined> {
    return run<T | undefined>('kv', 'readonly', (s) => s.get(key));
  },
  set(key: string, value: unknown): Promise<IDBValidKey> {
    return run('kv', 'readwrite', (s) => s.put(value, key));
  },
  delete(key: string): Promise<undefined> {
    return run('kv', 'readwrite', (s) => s.delete(key));
  },
};

export type OutboxType = 'report' | 'photo' | 'access_request' | 'task_status';

export interface OutboxItem {
  id: string;            // uuid de l'action (= client_uuid envoyé à l'API)
  type: OutboxType;
  payload: Record<string, any>;
  blob?: Blob;           // photo
  createdAt: number;
  attempts: number;
  lastError?: string;
}

export const outbox = {
  all(): Promise<OutboxItem[]> {
    return run<OutboxItem[]>('outbox', 'readonly', (s) => s.getAll()).then((items) =>
      items.sort((a, b) => a.createdAt - b.createdAt)
    );
  },
  put(item: OutboxItem): Promise<IDBValidKey> {
    return run('outbox', 'readwrite', (s) => s.put(item));
  },
  delete(id: string): Promise<undefined> {
    return run('outbox', 'readwrite', (s) => s.delete(id));
  },
};

/** Efface toutes les données locales (déconnexion, changement de compte). */
export async function wipeLocalData(): Promise<void> {
  await run('kv', 'readwrite', (s) => s.clear());
  await run('outbox', 'readwrite', (s) => s.clear());
}
