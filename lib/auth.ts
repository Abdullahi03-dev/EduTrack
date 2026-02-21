import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    User,
    updateProfile,
    sendEmailVerification,
} from 'firebase/auth';
import { auth } from './firebase';

// Google OAuth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account', // Always show account selection
});

// Sign up with Email and Password
export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update profile with display name
        if (userCredential.user) {
            await updateProfile(userCredential.user, {
                displayName: displayName,
            });

            // Send email verification for security
            await sendEmailVerification(userCredential.user);
        }

        return { user: userCredential.user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message };
    }
};

// Sign in with Email and Password
export const signInWithEmail = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error: any) {
        // Provide user-friendly error messages
        let errorMessage = 'An error occurred during sign in.';

        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect Credentials.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid Credentials.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'This account has been disabled.';
        }

        return { user: null, error: errorMessage };
    }
};

// Sign in with Google OAuth (using popup for reliable cross-origin auth)
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return { user: result.user, error: null };
    } catch (error: any) {
        let errorMessage = 'An error occurred during Google sign in.';

        if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            errorMessage = 'An account already exists with this email using a different sign-in method.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            // User opened multiple popups, ignore this silently
            return { user: null, error: null };
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Google sign-in is not enabled. Please contact support.';
        }

        return { user: null, error: errorMessage };
    }
};

// Sign out
export const logOut = async () => {
    try {
        await signOut(auth);
        return { error: null };
    } catch (error: any) {
        return { error: error.message };
    }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
