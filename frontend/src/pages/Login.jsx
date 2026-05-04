import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login', { email, password });
      if (response.data.access_token) {
        const loggedInUser = response.data.user;
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(loggedInUser));

        if (loggedInUser.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-panel p-10 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Welcome</h1>
          <p className="text-slate-500">Sign in to manage the guestbook</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              placeholder="receptionist@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-8"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
