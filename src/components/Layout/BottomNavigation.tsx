import React from 'react';
import { Home, Receipt, BarChart3, Settings, FileText } from 'lucide-react';
import { mn } from '../../utils/mongolian';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: mn.home, icon: Home },
    { id: 'transactions', label: mn.transactions, icon: Receipt },
    { id: 'reports', label: mn.reports, icon: FileText },
    { id: 'analytics', label: mn.analytics, icon: BarChart3 },
    { id: 'settings', label: mn.settings, icon: Settings }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 safe-area-pb">
      <div className="grid grid-cols-5 gap-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
              activeTab === id
                ? 'bg-green-500 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs mt-1 font-medium leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;