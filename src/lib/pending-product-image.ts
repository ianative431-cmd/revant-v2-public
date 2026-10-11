const DATABASE_NAME = "revant-local-drafts";
const STORE_NAME = "images";
const PENDING_IMAGE_KEY = "pending-product-image";

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Le stockage local de ce navigateur n'est pas disponible."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Ouverture du stockage local impossible."));
  });
}

/** Garde l'image choisie localement pour la transmettre au formulaire, sans l'envoyer au serveur. */
export async function savePendingProductImage(file: File): Promise<void> {
  const database = await openDraftDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(file, PENDING_IMAGE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Enregistrement local impossible."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Enregistrement local interrompu."));
    });
  } finally {
    database.close();
  }
}

/** Récupère puis efface le brouillon local pour éviter de réutiliser une ancienne photo. */
export async function consumePendingProductImage(): Promise<File | null> {
  const database = await openDraftDatabase();
  try {
    const file = await new Promise<File | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(PENDING_IMAGE_KEY);
      request.onsuccess = () => resolve(request.result instanceof File ? request.result : null);
      request.onerror = () => reject(request.error ?? new Error("Lecture du brouillon impossible."));
    });
    if (file) {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(PENDING_IMAGE_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error("Nettoyage du brouillon impossible."));
        transaction.onabort = () => reject(transaction.error ?? new Error("Nettoyage du brouillon interrompu."));
      });
    }
    return file;
  } finally {
    database.close();
  }
}
