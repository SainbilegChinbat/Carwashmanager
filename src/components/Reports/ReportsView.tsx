import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText, Users, TrendingUp, Share, DollarSign, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import { Transaction, Employee } from '../../types';
import { getTransactions, getEmployees, exportAllReportsToSingleCSV, shareToMessenger, generateReportSummary, exportEmployeeSalaryReport } from '../../utils/storage';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import EmployeeCommissionDetailsModal from './EmployeeCommissionDetailsModal';

const ReportsView: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dateRange, setDateRange] = useState({
    from: format(new Date(), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [activeReport, setActiveReport] = useState<'daily' | 'employee' | 'service'>('daily');
  const [isSharing, setIsSharing] = useState(false);
  const [showEmployeeCommissionDetails, setShowEmployeeCommissionDetails] = useState<{
    employeeId: string;
    employeeName: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    setTransactions(getTransactions(user.id));
    setEmployees(getEmployees(user.id));
  }, [user]);

  const getFilteredTransactions = () => {
    const fromDate = startOfDay(new Date(dateRange.from));
    const toDate = endOfDay(new Date(dateRange.to));

    return transactions.filter(transaction =>
      isWithinInterval(new Date(transaction.date), { start: fromDate, end: toDate })
    );
  };

  const generateTimeRangeLabel = () => {
    return `${dateRange.from}-${dateRange.to}`;
  };

  const generateDailyReport = () => {
    const filtered = getFilteredTransactions();
    const dailyData: { [key: string]: any } = {};

    filtered.forEach(transaction => {
      const dateKey = format(new Date(transaction.date), 'yyyy-MM-dd');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          'Огноо': dateKey,
          'Нийт орлого': 0,
          'Нийт гүйлгээ': 0,
          'Нийт цалин': 0,
          'Үйлчилгээний тоо': 0,
          'Бэлэн мөнгө': 0,
          'Шилжүүлэг': 0,
          'Карт': 0
        };
      }

      dailyData[dateKey]['Нийт орлого'] += transaction.totalAmount;
      dailyData[dateKey]['Нийт гүйлгээ'] += 1;
      dailyData[dateKey]['Нийт цалин'] += transaction.commissions.reduce((sum, c) => sum + c.amount, 0);
      dailyData[dateKey]['Үйлчилгээний тоо'] += transaction.services.length;
      dailyData[dateKey][transaction.paymentMethod === 'cash' ? 'Бэлэн мөнгө' : 
                        transaction.paymentMethod === 'transfer' ? 'Шилжүүлэг' : 'Карт'] += transaction.totalAmount;
    });

    return Object.values(dailyData);
  };

  const generateEmployeeReport = () => {
    const filtered = getFilteredTransactions();
    const employeeData: { [key: string]: any } = {};

    employees.forEach(employee => {
      employeeData[employee.id] = {
        'Ажилтны нэр': employee.name,
        'Утас': employee.phone,
        'Үндсэн цалин хувь': `${employee.defaultCommissionRate}%`,
        'Нийт цалин': 0,
        'Үйлчилгээний тоо': 0,
        'Орлогын хувь': 0,
        'Цалин олгосон': 0,
        'Цалин олгоогүй': 0,
        'Тэмдэглэл': '',
        'employeeId': employee.id // Store employee ID for actions
      };
    });

    filtered.forEach(transaction => {
      transaction.commissions.forEach(commission => {
        if (employeeData[commission.employeeId]) {
          employeeData[commission.employeeId]['Нийт цалин'] += commission.amount;
          employeeData[commission.employeeId]['Үйлчилгээний тоо'] += 1;
          
          // Track paid/unpaid commissions
          if (commission.isPaid) {
            employeeData[commission.employeeId]['Цалин олгосон'] += 1;
          } else {
            employeeData[commission.employeeId]['Цалин олгоогүй'] += 1;
          }
        }
      });

      transaction.employees.forEach(employeeId => {
        if (employeeData[employeeId]) {
          employeeData[employeeId]['Орлогын хувь'] += transaction.totalAmount / transaction.employees.length;
        }
      });
    });

    return Object.values(employeeData);
  };

  const generateServiceReport = () => {
    const filtered = getFilteredTransactions();
    const serviceData: { [key: string]: any } = {};

    filtered.forEach(transaction => {
      transaction.services.forEach(service => {
        if (!serviceData[service.serviceId]) {
          serviceData[service.serviceId] = {
            'Үйлчилгээний нэр': service.serviceName,
            'Нийт орлого': 0,
            'Хийгдсэн тоо': 0,
            'Дундаж үнэ': 0,
            'Нийт цалин': 0
          };
        }

        serviceData[service.serviceId]['Нийт орлого'] += service.price;
        serviceData[service.serviceId]['Хийгдсэн тоо'] += 1;
        serviceData[service.serviceId]['Нийт цалин'] += service.price * (service.commissionRate / 100);
      });
    });

    Object.values(serviceData).forEach((service: any) => {
      service['Дундаж үнэ'] = service['Нийт орлого'] / service['Хийгдсэн тоо'];
    });

    return Object.values(serviceData);
  };

  const exportReport = () => {
    const dailyData = generateDailyReport();
    const employeeData = generateEmployeeReport();
    const serviceData = generateServiceReport();
    
    const filename = `combined-report-${generateTimeRangeLabel()}`;
    
    exportAllReportsToSingleCSV(dailyData, employeeData, serviceData, filename, dateRange);
  };

  const handleEmployeeExport = (employee: Employee) => {
    const filtered = getFilteredTransactions();
    const timeRangeLabel = generateTimeRangeLabel();
    
    if (user) {
      exportEmployeeSalaryReport(employee, filtered, timeRangeLabel, user);
    }
  };

  const handleCommissionPayment = (employeeId: string, employeeName: string) => {
    setShowEmployeeCommissionDetails({ employeeId, employeeName });
  };

  const handleCommissionDetailsClose = () => {
    setShowEmployeeCommissionDetails(null);
  };

  const handleCommissionDetailsSave = () => {
    // Refresh transactions
    if (user) {
      setTransactions(getTransactions(user.id));
    }
    setShowEmployeeCommissionDetails(null);
  };

  const shareReport = async () => {
    setIsSharing(true);
    
    try {
      let reportSummary = '';

      switch (activeReport) {
        case 'daily': {
          const data = generateDailyReport();
          const totals = data.reduce((acc, day) => ({
            revenue: acc.revenue + (day['Нийт орлого'] || 0),
            transactions: acc.transactions + (day['Нийт гүйлгээ'] || 0),
            services: acc.services + (day['Үйлчилгээний тоо'] || 0),
            commissions: acc.commissions + (day['Нийт цалин'] || 0)
          }), { revenue: 0, transactions: 0, services: 0, commissions: 0 });

          reportSummary = `🚗 ӨДРИЙН ТАЙЛАН (${dateRange.from} - ${dateRange.to})

💰 Нийт орлого: ₮${totals.revenue.toLocaleString()}
📊 Нийт гүйлгээ: ${totals.transactions}
🔧 Нийт үйлчилгээ: ${totals.services}
💵 Нийт цалин: ₮${totals.commissions.toLocaleString()}

📅 Үүсгэсэн: ${new Date().toLocaleString('mn-MN')}`;
          break;
        }
        case 'employee': {
          const data = generateEmployeeReport();
          const totalEarnings = data.reduce((sum, emp: any) => sum + (emp['Нийт цалин'] || 0), 0);
          const totalServices = data.reduce((sum, emp: any) => sum + (emp['Үйлчилгээний тоо'] || 0), 0);

          reportSummary = `👥 АЖИЛТНЫ ТАЙЛАН (${dateRange.from} - ${dateRange.to})

👨‍💼 Ажилтны тоо: ${data.length}
💰 Нийт цалин: ₮${totalEarnings.toLocaleString()}
🔧 Нийт үйлчилгээ: ${totalServices}

📅 Үүсгэсэн: ${new Date().toLocaleString('mn-MN')}`;
          break;
        }
        case 'service': {
          const data = generateServiceReport();
          const totalRevenue = data.reduce((sum, service: any) => sum + (service['Нийт орлого'] || 0), 0);
          const totalCount = data.reduce((sum, service: any) => sum + (service['Хийгдсэн тоо'] || 0), 0);

          reportSummary = `🔧 ҮЙЛЧИЛГЭЭНИЙ ТАЙЛАН (${dateRange.from} - ${dateRange.to})

🏷️ Үйлчилгээний төрөл: ${data.length}
💰 Нийт орлого: ₮${totalRevenue.toLocaleString()}
📊 Нийт тоо хэмжээ: ${totalCount}

📅 Үүсгэсэн: ${new Date().toLocaleString('mn-MN')}`;
          break;
        }
      }

      if (!reportSummary) {
        alert('Хуваалцах өгөгдөл байхгүй');
        return;
      }

      const success = await shareToMessenger(reportSummary);
      
      if (success) {
        // Success feedback is handled in shareToMessenger function
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      alert('Хуваалцахад алдаа гарлаа');
    } finally {
      setIsSharing(false);
    }
  };

  const renderDailyReport = () => {
    const data = generateDailyReport();
    const totals = data.reduce((acc, day) => ({
      revenue: acc.revenue + (day['Нийт орлого'] || 0),
      transactions: acc.transactions + (day['Нийт гүйлгээ'] || 0),
      commissions: acc.commissions + (day['Нийт цалин'] || 0),
      services: acc.services + (day['Үйлчилгээний тоо'] || 0)
    }), { revenue: 0, transactions: 0, commissions: 0, services: 0 });

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 p-3 rounded-xl">
            <h3 className="text-gray-400 text-xs">Нийт орлого</h3>
            <p className="text-green-400 text-lg font-bold">₮{totals.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            <h3 className="text-gray-400 text-xs">Нийт гүйлгээ</h3>
            <p className="text-white text-lg font-bold">{totals.transactions}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            <h3 className="text-gray-400 text-xs">Нийт үйлчилгээ</h3>
            <p className="text-white text-lg font-bold">{totals.services}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            <h3 className="text-gray-400 text-xs">Нийт цалин</h3>
            <p className="text-yellow-400 text-lg font-bold">₮{totals.commissions.toLocaleString()}</p>
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="space-y-3">
          {data.map((day, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-white font-medium">{day['Огноо']}</h4>
                <span className="text-green-400 font-bold">₮{day['Нийт орлого'].toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Гүйлгээ: </span>
                  <span className="text-white">{day['Нийт гүйлгээ']}</span>
                </div>
                <div>
                  <span className="text-gray-400">Үйлчилгээ: </span>
                  <span className="text-white">{day['Үйлчилгээний тоо']}</span>
                </div>
                <div>
                  <span className="text-gray-400">Цалин: </span>
                  <span className="text-yellow-400">₮{day['Нийт цалин'].toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEmployeeReport = () => {
    const data = generateEmployeeReport();

    return (
      <div className="space-y-4">
        {data.map((employee: any, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-3 flex-1">
                <h4 className="text-white font-bold text-lg">{employee['Ажилтны нэр']}</h4>
                <button
                  onClick={() => {
                    const emp = employees.find(e => e.name === employee['Ажилтны нэр']);
                    if (emp) handleEmployeeExport(emp);
                  }}
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  title="Цалингийн тайлан татах"
                >
                  <Download size={16} className="text-white" />
                </button>
                <button
                  onClick={() => handleCommissionPayment(employee['employeeId'], employee['Ажилтны нэр'])}
                  className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
                  title="Цалин өгсөн гэж тэмдэглэх"
                >
                  <DollarSign size={16} className="text-white" />
                </button>
              </div>
              <span className="text-yellow-400 font-bold">₮{employee['Нийт цалин'].toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Үйлчилгээ: </span>
                <span className="text-white">{employee['Үйлчилгээний тоо']}</span>
              </div>
              <div>
                <span className="text-gray-400">Орлого: </span>
                <span className="text-green-400">₮{employee['Орлогын хувь'].toLocaleString()}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Цалин: </span>
                <span className="text-green-400">Олгосон: {employee['Цалин олгосон']}</span>
                <span className="text-red-400 ml-4">Олгоогүй: {employee['Цалин олгоогүй']}</span>
              </div>
            </div>
            
            {/* Notes section */}
            {employee['Тэмдэглэл'] && (
              <div className="border-t border-gray-700 pt-3 mt-3">
                <p className="text-gray-400 text-xs mb-1">Тэмдэглэл:</p>
                <p className="text-gray-300 text-sm break-words">{employee['Тэмдэглэл']}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderServiceReport = () => {
    const data = generateServiceReport();

    return (
      <div className="space-y-4">
        {data.map((service: any, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white font-bold text-lg">{service['Үйлчилгээний нэр']}</h4>
              <span className="text-green-400 font-bold">₮{service['Нийт орлого'].toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Тоо хэмжээ: </span>
                <span className="text-white">{service['Хийгдсэн тоо']}</span>
              </div>
              <div>
                <span className="text-gray-400">Дундаж үнэ: </span>
                <span className="text-white">₮{service['Дундаж үнэ'].toLocaleString()}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Нийт цалин: </span>
                <span className="text-yellow-400">₮{service['Нийт цалин'].toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-black min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-bold">{mn.reports}</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={shareReport}
              disabled={isSharing}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white p-2 rounded-full transition-colors flex items-center justify-center"
              title={mn.shareToMessenger}
            >
              {isSharing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Share size={18} />
              )}
            </button>
            <button
              onClick={exportReport}
              className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full transition-colors"
              title="Нэгтгэсэн тайлан татах"
            >
              <FileText size={18} />
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-white text-xs font-medium mb-1">{mn.from}</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white text-xs font-medium mb-1">{mn.to}</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: 'daily', label: 'Өдрийн тайлан', icon: Calendar },
            { id: 'employee', label: 'Ажилтны тайлан', icon: Users },
            { id: 'service', label: 'Үйлчилгээний тайлан', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveReport(id as any)}
              className={`flex flex-col items-center justify-center space-y-1 py-2.5 px-2 rounded-lg transition-colors ${
                activeReport === id
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

      {/* Report Content */}
      <div className="px-4">
        {activeReport === 'daily' && renderDailyReport()}
        {activeReport === 'employee' && renderEmployeeReport()}
        {activeReport === 'service' && renderServiceReport()}
      </div>

      {/* Employee Commission Details Modal */}
      {showEmployeeCommissionDetails && (
        <EmployeeCommissionDetailsModal
          employeeId={showEmployeeCommissionDetails.employeeId}
          employeeName={showEmployeeCommissionDetails.employeeName}
          onClose={handleCommissionDetailsClose}
          onSave={handleCommissionDetailsSave}
        />
      )}
    </div>
  );
};

export default ReportsView;