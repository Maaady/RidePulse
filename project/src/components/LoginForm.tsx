import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User, Truck, Shield } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const quickLogin = (role: string) => {
    const credentials = {
      rider: { email: 'rider@ridepulse.com', password: 'password' },
      driver: { email: 'driver@ridepulse.com', password: 'password' },
      admin: { email: 'admin@ridepulse.com', password: 'password' }
    };
    const cred = credentials[role as keyof typeof credentials];
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary-500 text-white p-3 rounded-full">
              <Truck className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RidePulse</h1>
          <p className="text-gray-600">Real-time Fleet Tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-4">Quick Demo Login:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickLogin('rider')}
              className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
            >
              <User className="w-5 h-5 text-gray-600 mb-1" />
              <span className="text-xs font-medium text-gray-700">Rider</span>
            </button>
            <button
              onClick={() => quickLogin('driver')}
              className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
            >
              <Truck className="w-5 h-5 text-gray-600 mb-1" />
              <span className="text-xs font-medium text-gray-700">Driver</span>
            </button>
            <button
              onClick={() => quickLogin('admin')}
              className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
            >
              <Shield className="w-5 h-5 text-gray-600 mb-1" />
              <span className="text-xs font-medium text-gray-700">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}