import { useState, useEffect } from 'react'
import './App.css'
import HomePage from './components/HomePage'
import { API_CONFIG } from './config/api'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setIsLoading(true)
    // Redirect to the backend login endpoint which will handle Auth0 redirect
    window.location.href = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.login}`
  }

  // Check for auth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (code) {
      // Handle the Auth0 callback
      fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.callback}?code=${code}`)
        .then(response => response.json())
        .then(data => {
          if (data.access_token) {
            // Store the token securely
            chrome.storage.local.set({ token: data.access_token }, () => {
              console.log('Token saved')
              setIsLoggedIn(true)
            })
          }
        })
        .catch(error => {
          console.error('Authentication error:', error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [])

  return (
    <div className="app">
      {isLoggedIn ? (
        <HomePage />
      ) : (
        <div className="login-container">
          <h1 className="logo">Fortisafe</h1>

          <button
            onClick={handleLogin}
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <div className="signup-prompt">
            Don't have an account? <a href="#">Sign up</a>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
