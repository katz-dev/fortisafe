'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserProfile } from '@/lib/api';

interface UserProfile {
    auth0Profile?: {
        name?: string;
        email?: string;
        picture?: string;
        nickname?: string;
    };
    _id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserProfile | null;
    isLoading: boolean;
    signOut: () => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
                const profile = await getUserProfile();
                setUser(profile);
                setIsAuthenticated(true);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchProfile();
    }, []);

    const signOut = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        setIsAuthenticated(false);
        setUser(null);
        window.location.href = '/';
    };

    const refreshProfile = async () => {
        setIsLoading(true);
        await fetchProfile();
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, isLoading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 