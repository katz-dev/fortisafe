'use client';
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUserProfile } from "@/lib/api";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkExistingSession() {
            // Check if we have the force_login parameter (from logout redirect)
            const forceLogin = searchParams.get('force_login');
            
            if (forceLogin === 'true') {
                console.log('Force login parameter detected, showing login page');
                // Always show the login page after logout
                window.location.href = `${backendUrl}/auth/login?prompt=login`;
                return;
            }
            
            // Check if we have the just_logged_out cookie
            const hasJustLoggedOut = document.cookie.split('; ').some(cookie => cookie.startsWith('just_logged_out=true'));
            
            // If user has just logged out, always show login page
            if (hasJustLoggedOut) {
                console.log('User just logged out, showing login page');
                // Clear the cookie
                document.cookie = 'just_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                // Force login prompt
                window.location.href = `${backendUrl}/auth/login?prompt=login`;
                return;
            }
            
            // Check if we have tokens in localStorage
            const accessToken = localStorage.getItem('access_token');
            const idToken = localStorage.getItem('id_token');

            if (accessToken && idToken) {
                try {
                    // Try to get the user profile with the existing token
                    await getUserProfile();
                    // If successful, redirect to the password page
                    console.log('Valid session found, redirecting to password page');
                    router.push('/password');
                    return;
                } catch (error) {
                    console.error('Session invalid, redirecting to login:', error);
                    // Clear invalid tokens
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('id_token');
                }
            }

            // If we don't have tokens or they're invalid, redirect to Auth0 login
            console.log('No valid session found, redirecting to Auth0 login');
            // Always use prompt=login to ensure the login page is shown
            window.location.href = `${backendUrl}/auth/login?prompt=login`;
        }

        void checkExistingSession();
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#080b15]">
            <div className="text-white text-center">
                <h1 className="text-2xl font-bold mb-4">FortiSafe</h1>
                <p>Checking authentication status...</p>
                <div className="mt-4 w-12 h-12 rounded-full border-4 border-t-transparent border-white animate-spin mx-auto"></div>
            </div>
        </div>
    );
}