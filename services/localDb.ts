// Serviço de Banco de Dados Local usando IndexedDB
// Focado APENAS no armazenamento de imagens (Histórico) para economizar custos de nuvem

const DB_NAME = 'CaricatureStudioDB';
const DB_VERSION = 1;

interface HistoryItem {
  id: string;
  userId: string;
  imageUrl: string; // Base64
  config: any;
  createdAt: number;
}

class LocalDatabase {
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Removemos a store 'users' pois agora os créditos ficam na nuvem (Firestore)
        if (db.objectStoreNames.contains('users')) {
          db.deleteObjectStore('users');
        }

        // Store para Histórico (Imagens)
        if (!db.objectStoreNames.contains('history')) {
          const store = db.createObjectStore('history', { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // --- HISTORY & STORAGE (Local) ---

  async saveToHistory(uid: string, imageBase64: string, config: any): Promise<void> {
    if (!this.db) await this.init();

    const item: HistoryItem = {
      id: Date.now().toString(),
      userId: uid,
      imageUrl: imageBase64,
      config,
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserHistory(uid: string): Promise<HistoryItem[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const index = store.index('userId');
      const request = index.getAll(uid);

      request.onsuccess = () => {
        const results = request.result as HistoryItem[];
        // Ordena do mais recente para o mais antigo
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

export const localDb = new LocalDatabase();
