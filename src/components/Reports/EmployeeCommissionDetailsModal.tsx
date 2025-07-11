import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, Calendar, Car } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import { Transaction } from '../../types';
import { getTransactions, markEmployeeCommissionAsPaid } from '../../utils/storage';
import { format } from 'date-fns';

interface EmployeeCommissionDetailsModalProps {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onSave: () => void;
}

const EmployeeCommissionDetailsModal: React.FC<EmployeeCommissionDetailsModalProps> = ({
  employeeId,
  employeeName,
  onClose,
  onSave
}) => {
  const { user } = useAuth();
  const [unpaidTransactions, setUnpaidTransactions] = useState<Transaction[]>([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const transactions = getTransactions(user.id);
    
    // Filter transactions where this employee has unpaid commissions
    const employeeUnpaidTransactions = transactions.filter(transaction => 
      transaction.commissions && 
      transaction.commissions.some(commission => 
        commission.employeeId === employeeId && !commission.isPaid
      )
    );

    setUnpaidTransactions(employeeUnpaidTransactions);
  }, [user, employeeId]);

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactionIds(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const selectAllTransactions = () => {
    setSelectedTransactionIds(unpaidTransactions.map(t => t.id));
  };

  const deselectAllTransactions = () => {
    setSelectedTransactionIds([]);
  };

  const getEmployeeCommissionFromTransaction = (transaction: Transaction) => {
    return transaction.commissions.find(c => c.employeeId === employeeId);
  };

  const calculateSelectedTotal = () => {
    return selectedTransactionIds.reduce((total, transactionId) => {
      const transaction = unpaidTransactions.find(t => t.id === transactionId);
      if (transaction) {
        const commission = getEmployeeCommissionFromTransaction(transaction);
        return total + (commission?.amount || 0);
      }
      return total;
    }, 0);
  };

  const handleMarkAsPaid = async () => {
    if (selectedTransactionIds.length === 0) {
      alert('Хамгийн багадаа нэг гүйлгээ сонгоно уу');
      return;
    }

    setLoading(true);

    try {
      const success = markEmployeeCommissionAsPaid(employeeId, selectedTransactionIds, paymentNotes);
      
      if (success) {
        onSave();
        onClose();
        alert('Цалин төлөгдсөн гэж амжилттай тэмдэглэгдлээ!');
      } else {
        alert('Алдаа гарлаа. Дахин оролдоно уу.');
      }
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      alert('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Бэлэн мөнгө';
      case 'transfer': return 'Шилжүүлэг';
      case 'card': return 'Карт';
      default: return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-500';
      case 'transfer': return 'bg-yellow-400';
      case 'card': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end z-50">
      <div className="bg-gray-900 w-full max-h-[90vh] rounded-t-3xl overflow-hidden">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <DollarSign size={24} className="text-black" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">{employeeName}</h2>
                <p className="text-gray-400 text-sm">Цалингийн дэлгэрэнгүй</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {unpaidTransactions.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={selectAllTransactions}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                >
                  Бүгдийг сонгох
                </button>
                <button
                  onClick={deselectAllTransactions}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                >
                  Бүгдийг цуцлах
                </button>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">Сонгогдсон:</p>
                <p className="text-yellow-400 font-bold">₮{calculateSelectedTotal().toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {unpaidTransactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Төлөгдөөгүй цалин байхгүй</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {unpaidTransactions.map((transaction) => {
                const commission = getEmployeeCommissionFromTransaction(transaction);
                const isSelected = selectedTransactionIds.includes(transaction.id);
                
                return (
                  <div 
                    key={transaction.id} 
                    className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                    onClick={() => toggleTransactionSelection(transaction.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-5 h-5 rounded border-2 transition-all ${
                          isSelected 
                            ? 'bg-yellow-500 border-yellow-500' 
                            : 'border-gray-600'
                        }`}>
                          {isSelected && (
                            <Check size={12} className="text-black m-0.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Car size={16} className="text-blue-400" />
                            <h3 className="text-white font-bold">{transaction.licensePlate}</h3>
                            <span className={`${getPaymentMethodColor(transaction.paymentMethod)} text-white text-xs px-2 py-1 rounded-full`}>
                              {getPaymentMethodLabel(transaction.paymentMethod)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar size={14} className="text-gray-400" />
                            <p className="text-gray-400 text-sm">
                              {format(new Date(transaction.date), 'yyyy-MM-dd HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold text-lg">
                          ₮{commission?.amount.toLocaleString() || 0}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {commission?.commissionRate || 0}% цалин
                        </p>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="space-y-1 mb-3">
                      {transaction.services.map((service, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300 truncate pr-2">{service.serviceName}</span>
                          <span className="text-white flex-shrink-0">₮{service.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Transaction Notes */}
                    {transaction.notes && (
                      <div className="border-t border-gray-700 pt-3">
                        <p className="text-gray-400 text-xs mb-1">Гүйлгээний тэмдэглэл:</p>
                        <p className="text-gray-300 text-sm break-words">{transaction.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {unpaidTransactions.length > 0 && (
            <>
              {/* Payment Notes */}
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">
                  Цалин төлсөн тэмдэглэл
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors resize-none"
                  placeholder="Цалин төлсөн огноо, хэрэгсэл гэх мэт..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  {mn.cancel}
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={selectedTransactionIds.length === 0 || loading}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-black font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check size={20} />
                      <span>Төлөгдсөн гэж тэмдэглэх</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeCommissionDetailsModal;