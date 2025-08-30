import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { DriverApp } from './components/DriverApp';
import { RiderApp } from './components/RiderApp';
import { AdminDashboard } from './components/AdminDashboard';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  switch (user.role) {
    case 'driver':
      return <DriverApp />;
    case 'rider':
      return <RiderApp />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <LoginForm />;
  }
}

function App() {
  return (
    <AuthProvider>
      <div className="font-sans">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;