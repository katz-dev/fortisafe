import './App.css'

function App() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempted')
    // Here you would add actual authentication logic
  }

  return (
    <div className="app">
      <div className="login-container">
        <h1 className="logo">Fortisafe</h1>

        <form onSubmit={handleSubmit}>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>

        <div className="signup-prompt">
          Don't have an account? <a href="#">Sign up</a>
        </div>
      </div>
    </div>
  )
}

export default App
