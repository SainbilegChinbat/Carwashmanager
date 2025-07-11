import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, Employee } from '../../types';

interface EmployeeChartProps {
  transactions: Transaction[];
  employees: Employee[];
}

const EmployeeChart: React.FC<EmployeeChartProps> = ({ transactions, employees }) => {
  const generateChartData = () => {
    const employeeData = employees.map(employee => {
      const employeeTransactions = transactions.filter(t => 
        t.employees.includes(employee.id)
      );

      const totalCommissions = transactions.reduce((sum, t) => {
        const employeeCommissions = t.commissions.filter(c => c.employeeId === employee.id);
        return sum + employeeCommissions.reduce((commSum, c) => commSum + c.amount, 0);
      }, 0);

      const totalRevenue = employeeTransactions.reduce((sum, t) => 
        sum + (t.totalAmount / t.employees.length), 0
      );

      return {
        name: employee.name,
        commissions: totalCommissions,
        revenue: totalRevenue,
        transactions: employeeTransactions.length
      };
    });

    return employeeData.sort((a, b) => b.commissions - a.commissions);
  };

  const data = generateChartData();

  if (data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-white font-bold text-lg mb-4">Ажилтны гүйцэтгэлийн график</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          Өгөгдөл байхгүй
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6">
      <h3 className="text-white font-bold text-lg mb-4">Ажилтны гүйцэтгэлийн график</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
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
                name === 'transactions' ? value : `₮${value.toLocaleString()}`,
                name === 'commissions' ? 'Цалин' : name === 'revenue' ? 'Орлого' : 'Гүйлгээ'
              ]}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Bar dataKey="commissions" fill="#FDE047" radius={[4, 4, 0, 0]} />
            <Bar dataKey="revenue" fill="#22C55E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-400 rounded"></div>
          <span className="text-gray-300 text-sm">Цалин</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-300 text-sm">Орлого</span>
        </div>
      </div>
    </div>
  );
};

export default EmployeeChart;