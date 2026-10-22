import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API || 'http://localhost:4000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

export const getTransactions = (ym) => API.get('/transactions', { params: { ym } });
export const createTransaction = (data) => API.post('/transactions', data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);
export const payTransaction = (id, amount) => API.put(`/transactions/${id}/pay`, { amount });

export const getClients = () => API.get('/clients');
export const createClient = (data) => API.post('/clients', data);

export const getSuppliers = () => API.get('/suppliers');
export const createSupplier = (data) => API.post('/suppliers', data);
