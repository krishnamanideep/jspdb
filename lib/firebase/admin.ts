require('dotenv').config();

import * as admin from 'firebase-admin';

try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_PROJECT_ID) {
      const certObj = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      admin.initializeApp({
        credential: admin.credential.cert(certObj as admin.ServiceAccount),
      });
    } else {
      console.warn('FIREBASE_PROJECT_ID not set, skipping Firebase initialization.');
    }
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

// Export a robust db object that throws if accessed when not initialized, 
// so route handlers can catch it.
export const db = admin.apps.length ? admin.firestore() : {
  collection: () => { throw new Error('Firebase not initialized'); }
} as any;

export const auth = admin.apps.length ? admin.auth() : {
  getUser: () => { throw new Error('Firebase not initialized'); }
} as any;