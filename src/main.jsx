import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { FamilyProvider } from './contexts/FamilyContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <FamilyProvider>
          <App />
        </FamilyProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
)
