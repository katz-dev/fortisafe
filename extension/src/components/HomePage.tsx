import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <header className="header">
        <h1 className="logo">Fortisafe</h1>
        <div className="header-right">
          <div className="user-avatar">
            <img src="/avatar-placeholder.png" alt="User avatar" />
          </div>
          <button className="settings-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      <div className="search-container">
        <input type="text" placeholder="Search" className="search-input" />
        <button className="search-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>

      <div className="menu-options">
        <div className="menu-item">
          <span className="menu-icon lock-icon">🔒</span>
          <span className="menu-text">Generate password</span>
        </div>
        
        <div className="menu-item">
          <span className="menu-icon scan-icon">📷</span>
          <span className="menu-text">Scan page</span>
        </div>
        
        <div className="menu-item">
          <span className="menu-icon fs-icon">Fs</span>
          <span className="menu-text">Fortisafe website</span>
        </div>
        
        <div className="menu-item">
          <span className="menu-icon help-icon">❓</span>
          <span className="menu-text">Help</span>
        </div>
      </div>

      <button className="logout-button">
        Log out
      </button>
    </div>
  );
};

export default HomePage;
