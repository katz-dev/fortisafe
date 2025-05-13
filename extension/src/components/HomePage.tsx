import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

interface HomePageProps {
  userData: any;
}

const HomePage: React.FC<HomePageProps> = ({ userData }) => {
  const userEmail = userData?.user?.email || userData?.email || 'User';
  const userName = userData?.user?.firstName || userData?.auth0Profile?.name || userEmail.split('@')[0];

  return (
    <div className="home-container">
      <header className="header">
        <h1>Fortisafe Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {userName}!</span>
          <Link to="/profile" className="profile-link">Profile</Link>
        </div>
      </header>

      <div className="content">
        <div className="card">
          <h2>Password Vault</h2>
          <p>You have 5 saved passwords</p>
          <button className="action-button">Manage Passwords</button>
        </div>

        <div className="card">
          <h2>Security Status</h2>
          <div className="security-score">
            <span>Security Score:</span>
            <div className="score-bar">
              <div className="score-fill" style={{ width: "75%" }}></div>
            </div>
            <span>75%</span>
          </div>
          <p>2 passwords need attention</p>
          <button className="action-button warning">Fix Issues</button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
