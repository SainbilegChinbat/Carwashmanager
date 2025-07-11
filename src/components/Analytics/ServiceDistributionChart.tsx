import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../../types';

interface ServiceDistributionChartProps {
  transactions: Transaction[];
}

const ServiceDistributionChart: React.FC<ServiceDistributionChartProps> = ({ transactions }) => {
  const generateChartData = () => {
    const serviceData: { [key: string]: { name: string; value: number; count: number } } = {};

    transactions.forEach(transaction => {
      transaction.services.forEach(service => {
        if (!serviceData[service.serviceId]) {
          serviceData[service.serviceId] = {
            name: service.serviceName,
            value: 0,
            count: 0
          };
        }
        serviceData[service.serviceId].value += service.price;
        serviceData[service.serviceId].count += 1;
      });
    });

    return Object.values(serviceData).sort((a, b) => b.value - a.value);
  };

  const data = generateChartData();
  const COLORS = ['#22C55E', '#FDE047', '#3B82F6', '#EF4444', '#8B5CF6', '#F97316'];

  if (data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-white font-bold text-lg mb-4">Үйлчилгээний хуваарь</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          Өгөгдөл байхгүй
        </div>
      </div>
    );
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6">
      <h3 className="text-white font-bold text-lg mb-4">Үйлчилгээний хуваарь</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any, name: string) => [
                `₮${value.toLocaleString()}`,
                'Орлого'
              ]}
              labelStyle={{ color: '#9CA3AF' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="space-y-2 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-gray-300 text-sm">{entry.name}</span>
            </div>
            <div className="text-right">
              <div className="text-white text-sm font-medium">₮{entry.value.toLocaleString()}</div>
              <div className="text-gray-400 text-xs">{entry.count} удаа</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceDistributionChart;