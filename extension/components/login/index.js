import React from 'react';
import styles from '../../styles/Pages.module.css';

export default function Login({ onLogin, onSignup }) {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '350px', // fallback for small popups
            minWidth: '300px',
            background: '#191825',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div className={styles.container} style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', borderRadius: '20px', background: '#191825', width: '90%', maxWidth: '400px', padding: '2rem 1.5rem' }}>
                <main className={styles.main} style={{ width: '100%', height: 'auto', minHeight: 'unset' }}>
                    <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 500, fontSize: '2.5rem', color: '#fff', marginBottom: '2rem' }}>Fortisafe</h1>
                    <button
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '20px',
                            background: '#6366F1',
                            color: '#fff',
                            fontSize: '1.5rem',
                            border: 'none',
                            marginBottom: '2rem',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                        onClick={onLogin}
                    >
                        Login
                    </button>
                    <div style={{ color: '#bdb7d7', fontSize: '1.25rem' }}>
                        Don't have an account?{' '}
                        <span
                            style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}
                            onClick={onSignup}
                        >
                            Sign up
                        </span>
                    </div>
                </main>
            </div>
        </div>
    );
} 