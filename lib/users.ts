import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * User Profile Interface
 */
export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    emailNotifications: boolean; // Whether user wants email reminders
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Create or update user profile in Firestore
 * Call this when a user signs up or updates their profile
 */
export async function createOrUpdateUserProfile(
    uid: string,
    email: string,
    name: string,
    emailNotifications: boolean = true
) {
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        const now = new Date();

        if (userDoc.exists()) {
            // Update existing user
            await updateDoc(userRef, {
                email,
                name,
                emailNotifications,
                updatedAt: now,
            });
        } else {
            // Create new user profile
            await setDoc(userRef, {
                uid,
                email,
                name,
                emailNotifications,
                createdAt: now,
                updatedAt: now,
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating/updating user profile:', error);
        return { success: false, error };
    }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                uid: data.uid,
                email: data.email,
                name: data.name,
                emailNotifications: data.emailNotifications ?? true,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

/**
 * Update email notification preference
 */
export async function updateEmailNotificationPreference(
    uid: string,
    enabled: boolean
) {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            emailNotifications: enabled,
            updatedAt: new Date(),
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating notification preference:', error);
        return { success: false, error };
    }
}
