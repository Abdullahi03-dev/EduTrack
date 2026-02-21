"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/auth';
import { createOrUpdateUserProfile } from '@/lib/users';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Helper function to set cookies
const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const secure = window.location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`;
};

// Helper function to delete cookies
const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            try {
                if (user) {
                    // Create user profile if new, or update email/name only
                    // Does NOT overwrite emailNotifications for existing users
                    await createOrUpdateUserProfile(
                        user.uid,
                        user.email || '',
                        user.displayName || 'Student'
                    );

                    // Set auth cookies for middleware - BEFORE setting user state
                    const token = await user.getIdToken();
                    setCookie('authToken', token, 7);
                    setCookie('emailVerified', user.emailVerified.toString(), 7);
                } else {
                    // Clear cookies on logout
                    deleteCookie('authToken');
                    deleteCookie('emailVerified');
                }
            } catch (error) {
                console.error('Error in auth state change:', error);
            } finally {
                // Always update user state after cookies are set
                setUser(user);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
