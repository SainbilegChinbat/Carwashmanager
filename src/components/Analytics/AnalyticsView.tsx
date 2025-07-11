import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, PieChart, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import { Transaction, Employee } from '../../types';
import { getTransactions, getEmployees } from '../../utils/storage';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import RevenueChart from './RevenueChart';
import EmployeeChart from './EmployeeChart';
import ServiceDistributionChart from './ServiceDistributionChart';

const AnalyticsView: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'custom'>('7days');
  const [customRange, setCustomRange] = useState({
    from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [activeChart, setActiveChart] = useState<'revenue' | 'employee' | 'service'>('revenue');

  useEffect(() => {
    if (!user) return;
    setTransactions(getTransactions(user.id));
    setEmployees(getEmployees(user.id));
  }, [user]);

  const getFilteredTransactions = () => {
    let fromDate: Date;
    let toDate = endOfDay(new Date());

    switch (timeRange) {
      case '7days':
        fromDate = startOfDay(subDays(new Date(), 7));
        break;
      case '30days':
        fromDate = startOfDay(subDays(new Date(), 30));
        break;
      case 'custom':
        fromDate = startOfDay(new Date(customRange.from));
        toDate = endOfDay(new Date(customRange.to));
        break;
      default:
        fromDate = startOfDay(subDays(new Date(), 7));
    }

    return transactions.filter(transaction =>
      isWithinInterval(new Date(transaction.date), { start: fromDate, end: toDate })
    );
  };

  const getAnalyticsData = () => {
    const filtered = getFilteredTransactions();
    
    const totalRevenue = filtered.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTransactions = filtered.length;
    const totalCommissions = filtered.reduce((sum, t) => 
      sum + t.commissions.reduce((commSum, c) => commSum + c.amount, 0), 0
    );
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalTransactions,
      totalCommissions,
      averageTransaction
    };
  };

  const analytics = getAnalyticsData();

  return (
    <div className="bg-black min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-bold">{mn.analytics}</h1>
        </div>

        {/* Time Range Selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: '7days', label: mn.days7 },
            { id: '30days', label: mn.days30 },
            { id: 'custom', label: mn.customRange }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTimeRange(id as any)}
              className={`py-2 px-3 rounded-lg transition-colors ${
                timeRange === id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {timeRange === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-white text-xs font-medium mb-1">{mn.from}</label>
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white text-xs font-medium mb-1">{mn.to}</label>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Analytics Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800 p-3 rounded-xl">
            <h3 className="text-gray-400 text-xs">Нийт орлого</h3>
            <p className="text-green-400 text-lg font-bold">₮{analytics.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            <h3 className="text-gray-400 text-xs">Нийт гүйлгээ</h3>
            <p className="text-white text-lg font-bold">{analytics.totalTransactions}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            <h3 className="text-gray-400 text-xs">Дундаж гүйлгээ</h3>
            <p className="text-blue-400 text-lg font-bold">₮{analytics.averageTransaction.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            <h3 className="text-gray-400 text-xs">Нийт цалин</h3>
            <p className="text-yellow-400 text-lg font-bold">₮{analytics.totalCommissions.toLocaleString()}</p>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: 'revenue', label: 'Орлогын график', icon: TrendingUp },
            { id: 'employee', label: 'Ажилтны график', icon: Users },
            { id: 'service', label: 'Үйлчилгээний хуваарь', icon: PieChart }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveChart(id as any)}
              className={`flex flex-col items-center justify-center space-y-1 py-2 px-2 rounded-lg transition-colors ${
                activeChart === id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon size={14} />
              <span className="text-xs font-medium text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart Content */}
      <div className="px-4">
        {activeChart === 'revenue' && (
          <RevenueChart transactions={getFilteredTransactions()} />
        )}
        {activeChart === 'employee' && (
          <EmployeeChart transactions={getFilteredTransactions()} employees={employees} />
        )}
        {activeChart === 'service' && (
          <ServiceDistributionChart transactions={getFilteredTransactions()} />
        )}
      </div>
    </div>
  );
};

export default AnalyticsView;