import React, { useState } from 'react';
import Index from '../components/Index';
import New from '../components/New';
import LoginSignup from '../components/login';
import Dashboard from '../components/Dashboard';
import AuthSuccess from './auth-success';

export default function Home() {
  const [activePage, setActivePage] = useState('index');
  const [user, setUser] = useState(null);

  const navigateToPage = (page) => {
    setActivePage(page);
  };

  const handleLogin = () => {
    // Redirect to backend login endpoint for Auth0
    window.location.href = 'http://localhost:8080/api/auth/login?client=extension';
  };

  const handleSignup = () => {
    alert('Sign up clicked!');
  };

  const handleLogout = () => {
    setUser(null);
    setActivePage('login');
  };

  return (
    <>
      {activePage === 'index' && <Index navigateToPage={navigateToPage} />}
      {activePage === 'new' && <New navigateToPage={navigateToPage} />}
      {activePage === 'login' && (
        <LoginSignup onLogin={handleLogin} onSignup={handleSignup} />
      )}
      {activePage === 'dashboard' && (
        <Dashboard onLogout={handleLogout} user={user} />
      )}
      {activePage === 'auth-success' && (
        <AuthSuccess navigateToPage={navigateToPage} setUser={setUser} />
      )}
    </>
  );
}
