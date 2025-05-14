import React, { useState, useEffect } from 'react';
import Index from '../components/Index';
import New from '../components/New';
import LoginSignup from '../components/login';
import Dashboard from '../components/Dashboard';
import AuthSuccess from './auth-success';

export default function Home() {
  const [activePage, setActivePage] = useState('index');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing auth state
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');

    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      setActivePage('dashboard');
    }
  }, []);

  const navigateToPage = (page) => {
    setActivePage(page);
  };

  const handleLogin = () => {
    // Open Auth0 login in a popup window
    const popup = window.open(
      'http://localhost:8080/api/auth/login?client=extension',
      'Auth0 Login',
      'width=600,height=700,left=200,top=200'
    );

    // Listen for messages from the popup
    window.addEventListener('message', (event) => {
      // Verify the origin of the message
      if (event.origin !== 'http://localhost:8080') return;

      // Handle the authentication response
      if (event.data.type === 'auth-success') {
        // Close the popup
        popup.close();

        // Store tokens
        localStorage.setItem('access_token', event.data.user.accessToken);
        localStorage.setItem('id_token', event.data.user.idToken);

        // Update the UI state
        setIsAuthenticated(true);
        setUser(event.data.user);
        setActivePage('dashboard');
      }
    }, false);
  };

  const handleSignup = () => {
    alert('Sign up clicked!');
  };

  const handleLogout = () => {
    // Clear auth state
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');

    setUser(null);
    setIsAuthenticated(false);
    setActivePage('login');
  };

  return (
    <>
      {activePage === 'index' && <Index navigateToPage={navigateToPage} />}
      {activePage === 'new' && <New navigateToPage={navigateToPage} />}
      {activePage === 'login' && !isAuthenticated && (
        <LoginSignup onLogin={handleLogin} onSignup={handleSignup} />
      )}
      {activePage === 'dashboard' && isAuthenticated && (
        <Dashboard onLogout={handleLogout} user={user} />
      )}
      {activePage === 'auth-success' && (
        <AuthSuccess navigateToPage={navigateToPage} setUser={setUser} />
      )}
    </>
  );
}
