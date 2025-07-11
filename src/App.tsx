import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import ForgotPasswordForm from './components/Auth/ForgotPasswordForm';
import DashboardView from './components/Dashboard/DashboardView';
import TransactionForm from './components/Transactions/TransactionForm';
import TransactionsList from './components/Transactions/TransactionsList';
import ReportsView from './components/Reports/ReportsView';
import AnalyticsView from './components/Analytics/AnalyticsView';
import SettingsView from './components/Settings/SettingsView';
import BottomNavigation from './components/Layout/BottomNavigation';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [activeTab, setActiveTab] = useState('home');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [refreshDashboardTrigger, setRefreshDashboardTrigger] = useState(0);

  // Reset to home tab when user changes (login/logout)
  useEffect(() => {
    setActiveTab('home');
  }, [user?.id]); // Only trigger when user ID changes

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Ачааллаж байна...</div>
      </div>
    );
  }

  if (!user) {
    const handleToggleMode = () => {
      if (authMode === 'login') {
        setAuthMode('signup');
      } else if (authMode === 'signup') {
        setAuthMode('login');
      } else if (authMode === 'forgot-password') {
        setAuthMode('login');
      }
    };

    const handleForgotPassword = () => {
      setAuthMode('forgot-password');
    };

    switch (authMode) {
      case 'login':
        return <LoginForm onToggleMode={handleToggleMode} onForgotPassword={handleForgotPassword} />;
      case 'signup':
        return <SignupForm onToggleMode={handleToggleMode} />;
      case 'forgot-password':
        return <ForgotPasswordForm onToggleMode={handleToggleMode} />;
      default:
        return <LoginForm onToggleMode={handleToggleMode} onForgotPassword={handleForgotPassword} />;
    }
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <DashboardView 
            onNewTransaction={() => setShowTransactionForm(true)} 
            refreshTrigger={refreshDashboardTrigger}
          />
        );
      case 'transactions':
        return <TransactionsList />;
      case 'reports':
        return <ReportsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView 
            onNewTransaction={() => setShowTransactionForm(true)} 
            refreshTrigger={refreshDashboardTrigger}
          />
        );
    }
  };

  const handleTransactionFormClose = (shouldRefresh?: boolean) => {
    setShowTransactionForm(false);
    if (shouldRefresh) {
      // Increment the trigger to force dashboard refresh
      setRefreshDashboardTrigger(prev => prev + 1);
    }
  };
  return (
    <>
      {renderActiveView()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      {showTransactionForm && (
        <TransactionForm onClose={handleTransactionFormClose} />
      )}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;