import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Receipt, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import { Transaction, Employee } from '../../types';
import { getTransactions, deleteTransaction, getEmployees } from '../../utils/storage';
import { format } from 'date-fns';
import TransactionEditForm from './TransactionEditForm';

const TransactionsList: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!user) return;
    const userTransactions = getTransactions(user.id);
    
    const userEmployees = getEmployees(user.id);
    
    setTransactions(userTransactions);
    setEmployees(userEmployees);
    setFilteredTransactions(userTransactions);
  }, [user]);

  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(t => {
        // Search by license plate
        const licensePlateMatch = t.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Search by service name
        const serviceMatch = t.services.some(s => 
          s.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Search by employee name
        const employeeMatch = t.commissions.some(c => 
          c.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return licensePlateMatch || serviceMatch || employeeMatch;
      });
    }

    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.toDateString() === filterDate.toDateString();
      });
    }

    // Maintain sorting after filtering
    filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setFilteredTransactions(filtered);
  }, [searchTerm, selectedDate, transactions]);

  const handleDeleteTransaction = (transactionId: string) => {
    deleteTransaction(transactionId);
    setTransactions(transactions.filter(t => t.id !== transactionId));
    setShowDeleteConfirm(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleTransactionUpdated = () => {
    // Refresh transactions list
    if (user) {
      const userTransactions = getTransactions(user.id);
      setTransactions(userTransactions);
    }
    setEditingTransaction(null);
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return mn.cash;
      case 'transfer': return mn.transfer;
      case 'card': return mn.card;
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
    <div className="bg-black min-h-screen pb-20">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-white text-2xl font-bold mb-6">{mn.transactions}</h1>

        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Улсын дугаар, үйлчилгээ эсвэл ажилтны нэрээр хайх..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-2xl">
            <h3 className="text-gray-400 text-sm">{mn.totalTransactions}</h3>
            <p className="text-white text-xl sm:text-2xl font-bold break-words">{filteredTransactions.length}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-2xl">
            <h3 className="text-gray-400 text-sm">{mn.totalAmount}</h3>
            <p className="text-white text-lg sm:text-xl lg:text-2xl font-bold break-words leading-tight">
              ₮{filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-6">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{mn.noData}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-gray-800 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-white font-bold text-lg truncate">{transaction.licensePlate}</h3>
                      <span className={`${getPaymentMethodColor(transaction.paymentMethod)} text-white text-xs px-2 py-1 rounded-full flex-shrink-0`}>
                        {getPaymentMethodLabel(transaction.paymentMethod)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {format(transaction.date, 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-green-400 font-bold text-base sm:text-lg lg:text-xl break-words leading-tight">
                      ₮{transaction.totalAmount.toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Засах"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(transaction.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Устгах"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-2 mb-3">
                  {transaction.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300 truncate pr-2">{service.serviceName}</span>
                      <span className="text-white flex-shrink-0">₮{service.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Commissions */}
                {transaction.commissions.length > 0 && (
                  <div className="border-t border-gray-700 pt-3 mb-3">
                    <p className="text-gray-400 text-xs mb-2">Цалин:</p>
                    <div className="space-y-1">
                      {transaction.commissions.map((commission, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="text-gray-300 truncate pr-2">{commission.employeeName}</span>
                          <span className="text-yellow-400 flex-shrink-0">₮{commission.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {transaction.notes && (
                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-gray-400 text-xs mb-1">Тэмдэглэл:</p>
                    <p className="text-gray-300 text-sm break-words">{transaction.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionEditForm
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={handleTransactionUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white text-lg font-bold mb-4">{mn.confirmDelete}</h3>
            <p className="text-gray-400 mb-6">Энэ гүйлгээг устгахдаа итгэлтэй байна уу?</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {mn.cancel}
              </button>
              <button
                onClick={() => handleDeleteTransaction(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {mn.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;