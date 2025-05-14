import React, { useEffect, useState } from 'react';
import styles from '../../styles/Pages.module.css';
import { useRouter } from 'next/router';

export default function Dashboard({ onLogout }) {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            fetch('http://localhost:8080/api/auth/profile', {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
                .then((res) => res.json())
                .then((profile) => {
                    setUser(profile);
                    localStorage.setItem('user', JSON.stringify(profile));
                })
                .catch(() => {
                    setUser(null);
                });
        } else {
            setUser(null);
        }
    }, []);

    const avatar = user?.auth0Profile?.picture || 'https://randomuser.me/api/portraits/men/32.jpg';
    const name = user?.auth0Profile?.name || user?.user?.firstName || 'User';
    const email = user?.auth0Profile?.email || user?.user?.email || '';

    const navigateToPage = (page) => {
        if (page === 'dashboard') router.replace('/dashboard');
        else if (page === 'login') router.replace('/login');
        else router.replace('/');
    };

    return (
        <div className={styles.container} style={{ background: '#191825', borderRadius: '20px', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', width: '400px', maxWidth: '95vw', padding: '2rem 1.5rem', minHeight: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 500, fontSize: '2.2rem', color: '#fff', margin: 0 }}>Fortisafe</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }} />
                        <span style={{ fontSize: '2rem', color: '#bdb7d7', cursor: 'pointer' }}>&#9881;</span>
                    </div>
                </div>
                {/* User Info */}
                <div style={{ color: '#bdb7d7', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: '1rem' }}>{email}</div>
                </div>
                {/* Search Bar */}
                <div style={{ background: '#2d2940', borderRadius: '16px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="Search"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#bdb7d7',
                            fontSize: '1.25rem',
                            flex: 1,
                            fontFamily: 'inherit',
                        }}
                    />
                    <span style={{ color: '#bdb7d7', fontSize: '1.5rem', marginLeft: '0.5rem' }}>&#128269;</span>
                </div>
                {/* Menu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>
                        <span style={{ fontSize: '1.7rem' }}>🔒</span> Generate password
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>
                        <span style={{ fontSize: '1.7rem', color: '#e58e9e' }}>🗂️</span> Scan page
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>
                        <span style={{ fontWeight: 700, color: '#3eb3b3', fontSize: '1.7rem' }}>Fs</span> Fortisafe website
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>
                        <span style={{ fontSize: '1.7rem', color: '#fff' }}>❓</span> Help
                    </div>
                </div>
            </div>
            {/* Logout Button */}
            <button
                style={{
                    width: '100%',
                    padding: '1.25rem',
                    borderRadius: '20px',
                    background: '#a594f9',
                    color: '#2d2940',
                    fontSize: '1.3rem',
                    border: 'none',
                    marginTop: '2rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                }}
                onClick={onLogout}
            >
                Log out
            </button>
        </div>
    );
} 