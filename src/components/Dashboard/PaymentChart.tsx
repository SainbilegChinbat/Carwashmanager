import React from 'react';
import { DashboardStats } from '../../types';

interface PaymentChartProps {
  stats: DashboardStats;
  isModal?: boolean;
}

const PaymentChart: React.FC<PaymentChartProps> = ({ stats, isModal = false }) => {
  const total = stats.paymentMethods.cash + stats.paymentMethods.transfer + stats.paymentMethods.card;
  
  if (total === 0) {
    return (
      <div className={`bg-gray-800 rounded-2xl ${isModal ? 'p-4' : 'p-6'}`}>
        <h3 className={`text-white font-bold ${isModal ? 'text-lg mb-3' : 'text-lg mb-4'}`}>
          {!isModal && 'Төлбөрийн хэрэгслийн хэрэглээ'}
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-400">
          Өгөгдөл байхгүй
        </div>
      </div>
    );
  }

  const cashPercent = (stats.paymentMethods.cash / total) * 100;
  const transferPercent = (stats.paymentMethods.transfer / total) * 100;
  const cardPercent = (stats.paymentMethods.card / total) * 100;

  const chartSize = isModal ? 'w-32 h-32' : 'w-48 h-48';

  return (
    <div className={`bg-gray-800 rounded-2xl ${isModal ? 'p-4' : 'p-6'}`}>
      {!isModal && (
        <h3 className="text-white font-bold text-lg mb-6">Төлбөрийн хэрэгслийн хэрэглээ</h3>
      )}
      
      <div className={`relative ${chartSize} mx-auto ${isModal ? 'mb-4' : 'mb-6'}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background Circle with Pop-up Animation */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="#374151"
            strokeWidth="10"
            className="animate-in zoom-in-50 duration-500 ease-out"
            style={{ animationDelay: '0ms' }}
          />
          
          {/* Cash Circle with Staggered Pop-up Animation */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="#22C55E"
            strokeWidth="10"
            strokeDasharray={`${cashPercent * 2.2} ${220 - cashPercent * 2.2}`}
            strokeDashoffset="0"
            className="transition-all duration-1000 ease-out animate-in zoom-in-75 slide-in-from-left-4"
            style={{ 
              animationDelay: '200ms',
              animationFillMode: 'both'
            }}
          />
          
          {/* Transfer Circle with Staggered Pop-up Animation */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="#FDE047"
            strokeWidth="10"
            strokeDasharray={`${transferPercent * 2.2} ${220 - transferPercent * 2.2}`}
            strokeDashoffset={`-${cashPercent * 2.2}`}
            className="transition-all duration-1000 ease-out animate-in zoom-in-75 slide-in-from-top-4"
            style={{ 
              animationDelay: '400ms',
              animationFillMode: 'both'
            }}
          />
          
          {/* Card Circle with Staggered Pop-up Animation */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="10"
            strokeDasharray={`${cardPercent * 2.2} ${220 - cardPercent * 2.2}`}
            strokeDashoffset={`-${(cashPercent + transferPercent) * 2.2}`}
            className="transition-all duration-1000 ease-out animate-in zoom-in-75 slide-in-from-right-4"
            style={{ 
              animationDelay: '600ms',
              animationFillMode: 'both'
            }}
          />
        </svg>
        
        {/* Center Total Amount with Pop-up Animation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in-50 fade-in duration-700 ease-out" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
          <div className="text-center">
            <p className={`text-gray-400 ${isModal ? 'text-xs' : 'text-xs'} font-medium`}>Нийт дүн</p>
            <p className={`text-white ${isModal ? 'text-sm' : 'text-lg'} font-bold`}>₮{total.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className={`space-y-${isModal ? '2' : '3'}`}>
        {/* Cash Row with Pop-up Animation */}
        <div 
          className={`flex items-center justify-between ${isModal ? 'p-2' : 'p-3'} bg-gray-700 rounded-xl transition-all duration-300 hover:bg-gray-600 animate-in slide-in-from-left-4 fade-in`}
          style={{ animationDelay: '1000ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center space-x-3">
            <div className={`${isModal ? 'w-3 h-3' : 'w-4 h-4'} bg-green-500 rounded-full shadow-lg animate-in zoom-in-75 duration-300`} style={{ animationDelay: '1100ms', animationFillMode: 'both' }}></div>
            <span className={`text-gray-300 ${isModal ? 'text-sm' : ''} font-medium`}>Бэлэн мөнгө</span>
          </div>
          <div className="text-right">
            <span className={`text-white ${isModal ? 'text-sm' : ''} font-bold`}>₮{stats.paymentMethods.cash.toLocaleString()}</span>
            <div className={`text-green-400 ${isModal ? 'text-xs' : 'text-xs'} animate-in slide-in-from-right-2 duration-300`} style={{ animationDelay: '1200ms', animationFillMode: 'both' }}>{cashPercent.toFixed(1)}%</div>
          </div>
        </div>

        {/* Transfer Row with Pop-up Animation */}
        <div 
          className={`flex items-center justify-between ${isModal ? 'p-2' : 'p-3'} bg-gray-700 rounded-xl transition-all duration-300 hover:bg-gray-600 animate-in slide-in-from-left-4 fade-in`}
          style={{ animationDelay: '1200ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center space-x-3">
            <div className={`${isModal ? 'w-3 h-3' : 'w-4 h-4'} bg-yellow-400 rounded-full shadow-lg animate-in zoom-in-75 duration-300`} style={{ animationDelay: '1300ms', animationFillMode: 'both' }}></div>
            <span className={`text-gray-300 ${isModal ? 'text-sm' : ''} font-medium`}>Шилжүүлэг</span>
          </div>
          <div className="text-right">
            <span className={`text-white ${isModal ? 'text-sm' : ''} font-bold`}>₮{stats.paymentMethods.transfer.toLocaleString()}</span>
            <div className={`text-yellow-400 ${isModal ? 'text-xs' : 'text-xs'} animate-in slide-in-from-right-2 duration-300`} style={{ animationDelay: '1400ms', animationFillMode: 'both' }}>{transferPercent.toFixed(1)}%</div>
          </div>
        </div>

        {/* Card Row with Pop-up Animation */}
        <div 
          className={`flex items-center justify-between ${isModal ? 'p-2' : 'p-3'} bg-gray-700 rounded-xl transition-all duration-300 hover:bg-gray-600 animate-in slide-in-from-left-4 fade-in`}
          style={{ animationDelay: '1400ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center space-x-3">
            <div className={`${isModal ? 'w-3 h-3' : 'w-4 h-4'} bg-blue-500 rounded-full shadow-lg animate-in zoom-in-75 duration-300`} style={{ animationDelay: '1500ms', animationFillMode: 'both' }}></div>
            <span className={`text-gray-300 ${isModal ? 'text-sm' : ''} font-medium`}>Карт</span>
          </div>
          <div className="text-right">
            <span className={`text-white ${isModal ? 'text-sm' : ''} font-bold`}>₮{stats.paymentMethods.card.toLocaleString()}</span>
            <div className={`text-blue-400 ${isModal ? 'text-xs' : 'text-xs'} animate-in slide-in-from-right-2 duration-300`} style={{ animationDelay: '1600ms', animationFillMode: 'both' }}>{cardPercent.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentChart;