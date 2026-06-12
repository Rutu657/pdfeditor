const DB_NAME = 'PDFEditorDB';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_store';
const KEY_NAME = 'active_pdf';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function storePdf(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`);
  }
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Store as Blob/File along with metadata
    const pdfData = {
      file: file,
      name: file.name,
      size: file.size,
      updatedAt: Date.now()
    };

    const request = store.put(pdfData, KEY_NAME);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getStoredPdf() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY_NAME);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get PDF from IndexedDB:', error);
    return null;
  }
}

export async function clearStoredPdf() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(KEY_NAME);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to clear PDF from IndexedDB:', error);
  }
}
