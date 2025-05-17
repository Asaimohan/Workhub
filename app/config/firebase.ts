import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBVbI27u3D2Rzg4cNX9x9xTGBW9it9y8_k",
    authDomain: "myapk-86681.firebaseapp.com",
    projectId: "myapk-86681",
    storageBucket: "myapk-86681.appspot.com",
    messagingSenderId: "354071657551",
    appId: "1:354071657551:web:3fda77ca2bb1b02d62be3a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized successfully');

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence for web
if (typeof window !== 'undefined') {
    // Enable offline persistence
    enableIndexedDbPersistence(db)
        .catch((err: Error) => {
            if (err.message.includes('failed-precondition')) {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.message.includes('unimplemented')) {
                console.warn('The current browser does not support persistence.');
            }
        });
}

// Export Firebase services
export { app, auth, db, storage };

// Default export for the Firebase app
export default app; 