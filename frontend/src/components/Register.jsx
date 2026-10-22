import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api';

export default function Register({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    try {
      const res = await register({ name, email, password });
      const { token, user } = res.data;
      onLogin(user, token);
      navigate('/');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Erreur d’inscription');
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Inscription</h2>

      <label>
        Nom
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <label>
        Mot de passe
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>

      <div className="err">{err}</div>
      <button className="btn" type="submit">S’inscrire</button>
    </form>
  );
}
