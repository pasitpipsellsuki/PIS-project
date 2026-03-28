import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const { login, isLoading, error, clearError, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) clearError()
  }, [email, password])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch {
      // Error handled by AuthContext
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError(null)

    if (regPassword !== regConfirm) {
      setRegisterError('Passwords do not match')
      return
    }
    if (regPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters')
      return
    }

    try {
      await api.post('/api/auth/register', {
        email: regEmail,
        password: regPassword,
        name: regName,
      })
      setRegisterSuccess(true)
      setTimeout(() => {
        setEmail(regEmail)
        setRegisterSuccess(false)
        setMode('login')
        setRegName('')
        setRegEmail('')
        setRegPassword('')
        setRegConfirm('')
      }, 1500)
    } catch (err: any) {
      setRegisterError(err.response?.data?.error || 'Registration failed. Please try again.')
    }
  }

  const switchMode = (next: 'login' | 'register') => {
    clearError()
    setRegisterError(null)
    setMode(next)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-icon">📦</div>
          <h1>Welcome back</h1>
          <p>Sign in to your PIS account</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
            type="button"
          >
            Create Account
          </button>
        </div>

        {mode === 'login' ? (
          <>
            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-login ${isLoading ? 'btn-loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="login-footer">
              <p>Don't have an account? <button className="link-btn" onClick={() => switchMode('register')}>Create one</button></p>
            </div>
          </>
        ) : (
          <>
            {registerError && <div className="login-error">{registerError}</div>}
            {registerSuccess && <div className="login-success">Account created! Redirecting to login...</div>}

            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <input
                  type="text"
                  id="reg-name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Your name"
                  required
                  disabled={registerSuccess}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email</label>
                <input
                  type="email"
                  id="reg-email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={registerSuccess}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    id="reg-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    disabled={registerSuccess}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex={-1}
                  >
                    {showRegPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm">Confirm Password</label>
                <input
                  type="password"
                  id="reg-confirm"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  disabled={registerSuccess}
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-login ${registerSuccess ? 'btn-loading' : ''}`}
                disabled={registerSuccess}
              >
                {registerSuccess ? 'Account Created!' : 'Create Account'}
              </button>
            </form>

            <div className="login-footer">
              <p>Already have an account? <button className="link-btn" onClick={() => switchMode('login')}>Sign in</button></p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
