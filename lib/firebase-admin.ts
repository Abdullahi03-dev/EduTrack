import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK - for server-side operations (cron jobs, API routes)
 * This bypasses Firestore security rules and has full access.
 * 
 * NEVER import this in client-side code!
 */

let adminApp: App;

if (!getApps().length) {
    // In production (Vercel), use service account credentials from env vars
    // In development, you can use the same env vars or a service account JSON file
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccount) {
        try {
            const parsedKey = JSON.parse(serviceAccount);
            adminApp = initializeApp({
                credential: cert(parsedKey),
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
        } catch (error) {
            console.error('Error parsing Firebase service account key:', error);
            // Fallback: initialize without explicit credentials
            // This works if running in a Google Cloud environment
            adminApp = initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
        }
    } else {
        // No service account key provided - initialize with project ID only
        // This will only work in environments with Application Default Credentials
        console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not set. Admin SDK may not work correctly.');
        adminApp = initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    }
} else {
    adminApp = getApps()[0];
}

// Admin Firestore instance (bypasses security rules)
export const adminDb = getFirestore(adminApp);

export default adminApp;
