import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthSuccess(props) {
    const router = useRouter();
    const navigateToPage = props.navigateToPage || ((page) => {
        if (page === 'dashboard') router.replace('/dashboard');
        else if (page === 'login') router.replace('/login');
        else router.replace('/');
    });
    const setUser = props.setUser || (() => { });

    useEffect(() => {
        // Parse tokens from URL
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access_token');
        const idToken = params.get('id_token');

        if (accessToken) {
            localStorage.setItem('access_token', accessToken);
            if (idToken) localStorage.setItem('id_token', idToken);

            // Fetch user profile
            fetch('http://localhost:8080/api/auth/profile', {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
                .then((res) => res.json())
                .then((profile) => {
                    console.log('Fetched user profile:', profile);
                    localStorage.setItem('user', JSON.stringify(profile));
                    setUser(profile);
                    navigateToPage('dashboard');
                })
                .catch(() => {
                    // On error, go back to login
                    navigateToPage('dashboard');
                });
        } else {
            navigateToPage('dashboard');
        }
    }, [navigateToPage, setUser, router]);

    return (
        <div style={{ color: '#fff', background: '#191825', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h2>Authenticating...</h2>
        </div>
    );
} 