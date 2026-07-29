import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'model' ? '/model' : '/staff');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white text-2xl font-bold shadow-glow-pink mb-4">
            H
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            House Of Her
          </h1>
          <p className="text-rose-700/60 mt-1 text-sm">Agency Operating System</p>
        </div>

        <form onSubmit={handle} className="card p-8 space-y-5">
          {error && (
            <div className="bg-rose-100 text-rose-700 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@houseofher.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-rose-600/50 space-y-1">
          <p>Demo accounts:</p>
          <p>Admin → admin@houseofher.com / admin123</p>
          <p>Staff → staff@houseofher.com / staff123</p>
          <p>Model → barbie@houseofher.com / model123</p>
        </div>
      </div>
    </div>
  );
}
