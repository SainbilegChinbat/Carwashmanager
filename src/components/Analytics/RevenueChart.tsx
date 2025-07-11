import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../types';
import { format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

interface RevenueChartProps {
  transactions: Transaction[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ transactions }) => {
  const generateChartData = () => {
    if (transactions.length === 0) return [];

    const dates = transactions.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const dateRange = eachDayOfInterval({ start: minDate, end: maxDate });
    
    return dateRange.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });

      const revenue = dayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
      const transactionCount = dayTransactions.length;

      return {
        date: format(date, 'MM/dd'),
        revenue,
        transactions: transactionCount
      };
    });
  };

  const data = generateChartData();

  if (data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-white font-bold text-lg mb-4">Өдрийн орлогын график</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          Өгөгдөл байхгүй
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6">
      <h3 className="text-white font-bold text-lg mb-4">Өдрийн орлогын график</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => `₮${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any, name: string) => [
                name === 'revenue' ? `₮${value.toLocaleString()}` : value,
                name === 'revenue' ? 'Орлого' : 'Гүйлгээ'
              ]}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#22C55E" 
              strokeWidth={3}
              dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#22C55E', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;