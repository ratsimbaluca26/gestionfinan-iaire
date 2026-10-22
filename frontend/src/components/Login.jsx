import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    try {
      const res = await login({ email, password });
      const { token, user } = res.data;
      onLogin(user, token);
      navigate('/');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Erreur de connexion');
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Connexion</h2>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <label>
        Mot de passe
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>

      <div className="err">{err}</div>
      <button className="btn" type="submit">Se connecter</button>
    </form>
  );
}
