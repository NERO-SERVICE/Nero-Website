import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const NERO_WEB_ROOT = "nero-web";

const safeSegment = (value) => String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

const getFirebaseConfig = (config) => {
    const resolved = config || window.NERO_FIREBASE_CONFIG;
    if (!resolved) {
        throw new Error("Firebase config is missing. Set window.NERO_FIREBASE_CONFIG before importing this module.");
    }
    return resolved;
};

export const initNeroFirebase = (config) => {
    const resolved = getFirebaseConfig(config);
    const app = getApps().length ? getApps()[0] : initializeApp(resolved);
    return {
        app,
        db: getFirestore(app, resolved.databaseId || "nero-web-db"),
        storage: getStorage(app),
    };
};

export const getNeroWebStoragePath = (fileName, folder = "images") => {
    const safeFolder = safeSegment(folder) || "images";
    const safeName = safeSegment(fileName) || "asset";
    return `${NERO_WEB_ROOT}/${safeFolder}/${Date.now()}-${safeName}`;
};

export const uploadNeroWebImage = async (file, options = {}) => {
    const { storage } = initNeroFirebase(options.config);
    const storagePath = options.path || getNeroWebStoragePath(file.name, options.folder || "images");
    const fileRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(fileRef, file, {
        contentType: file.type || "application/octet-stream",
        customMetadata: {
            source: "nero-web",
            purpose: options.purpose || "landing_asset",
        },
    });
    return {
        path: snapshot.metadata.fullPath,
        url: await getDownloadURL(snapshot.ref),
    };
};

export const addNeroWebData = async (collectionName, data, options = {}) => {
    const { db } = initNeroFirebase(options.config);
    const safeCollection = safeSegment(collectionName) || "records";
    const target = collection(db, NERO_WEB_ROOT, safeCollection, "items");
    const docRef = await addDoc(target, {
        ...data,
        createdAt: serverTimestamp(),
        source: "nero-web",
    });
    return docRef.id;
};
