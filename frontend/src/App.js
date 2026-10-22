import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const handleLogin = (data, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <header className="topbar">
        <h1><Link to="/">Mon budget</Link></h1>
        <nav>
          {user ? (
            <>
              <span>Bonjour {user.name || user.email}</span>
              <button className="btn small" onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login">Connexion</Link>
              <Link to="/register">Inscription</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route
            path="/"
            element={user ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={<Login onLogin={handleLogin} />}
          />
          <Route
            path="/register"
            element={<Register onLogin={handleLogin} />}
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
