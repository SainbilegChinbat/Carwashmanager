import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  subtitle: string;
  value: string;
  icon: LucideIcon;
  color: 'green' | 'yellow' | 'blue';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, subtitle, value, icon: Icon, color }) => {
  const colorClasses = {
    green: 'bg-green-500 text-black',
    yellow: 'bg-yellow-400 text-black',
    blue: 'bg-blue-500 text-white'
  };

  const iconColorClasses = {
    green: 'bg-black/10',
    yellow: 'bg-black/10',
    blue: 'bg-white/10'
  };

  return (
    <div className={`${colorClasses[color]} p-6 rounded-2xl relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm opacity-80">{subtitle}</p>
        </div>
        <div className={`${iconColorClasses[color]} p-2 rounded-full`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="text-2xl font-bold">
        {value}
      </div>
    </div>
  );
};

export default StatsCard;