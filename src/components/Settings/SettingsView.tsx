import React, { useState } from 'react';
import { Settings, User, Briefcase, Users, Wrench, Lock, LogOut, Car } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import ServicesSettings from './ServicesSettings';
import EmployeesSettings from './EmployeesSettings';
import BusinessProfile from './BusinessProfile';
import PasswordSettings from './PasswordSettings';

const SettingsView: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'services' | 'employees' | 'password'>('profile');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const sections = [
    { id: 'profile', label: mn.businessProfile, icon: Briefcase },
    { id: 'services', label: mn.services, icon: Wrench },
    { id: 'employees', label: mn.employees, icon: Users },
    { id: 'password', label: mn.changePassword, icon: Lock }
  ];

  const handleSignOut = () => {
    logout();
    setShowSignOutConfirm(false);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <BusinessProfile />;
      case 'services':
        return <ServicesSettings />;
      case 'employees':
        return <EmployeesSettings />;
      case 'password':
        return <PasswordSettings />;
      default:
        return <BusinessProfile />;
    }
  };

  return (
    <div className="bg-black min-h-screen pb-20">
      {/* Header with Logo and Sign Out */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Car size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">CARWASH MANAGER</h1>
              <p className="text-gray-400 text-sm">{user?.user_metadata?.businessName || user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <LogOut size={20} className="text-white" />
          </button>
        </div>

        <h2 className="text-white text-xl font-bold mb-6">{mn.settings}</h2>

        {/* Section Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id as any)}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                activeSection === id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section Content */}
      <div className="px-6">
        {renderActiveSection()}
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} className="text-white" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">{mn.confirmSignOut}</h3>
              <p className="text-gray-400">Та системээс гарахдаа итгэлтэй байна уу?</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {mn.cancel}
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {mn.signOut}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;