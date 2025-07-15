import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, X, Clock, Car, Eye, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import { DashboardStats, Transaction, Appointment } from '../../types';
import { getTransactions, getPendingServices, getAppointments } from '../../utils/storage';
import { useAppointmentReminders } from '../../hooks/useAppointmentReminders';
import StatsCard from './StatsCard';
import PaymentChart from './PaymentChart';
import PendingServicesList from './PendingServicesList';
import AppointmentsList from './AppointmentsList';
import AppointmentReminders from './AppointmentReminders';

interface DashboardViewProps {
  onNewTransaction: () => void;
  refreshTrigger?: number;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNewTransaction, refreshTrigger }) => {
  const { user } = useAuth();
  const { reminders, markAsRead, markAllAsRead } = useAppointmentReminders();
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalServices: 0,
    totalCommissions: 0,
    pendingServices: 0,
    pendingAmount: 0,
    appointmentCount: 0,
    paymentMethods: {
      cash: 0,
      transfer: 0,
      card: 0
    }
  });
  const [showPendingServices, setShowPendingServices] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showPaymentChart, setShowPaymentChart] = useState(false);

  // Auto-show reminders when they appear
  useEffect(() => {
    if (reminders.length > 0 && !showReminders) {
      setShowReminders(true);
    }
  }, [reminders.length, showReminders]);

  useEffect(() => {
    if (!user) return;

    const transactions = getTransactions(user.id);
    const pendingServices = getPendingServices(user.id);
    const appointments = getAppointments(user.id);
    
    const today = new Date();

    // Filter today's completed transactions only
    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      
      // Get local date components for comparison
      const transactionYear = transactionDate.getFullYear();
      const transactionMonth = transactionDate.getMonth();
      const transactionDay = transactionDate.getDate();
      
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDay = today.getDate();
      
      // Compare local date components to determine if it's today
      return transactionYear === todayYear &&
             transactionMonth === todayMonth &&
             transactionDay === todayDay &&
             t.status === 'completed';
    });

    // Count upcoming appointments (not completed or cancelled)
    const upcomingAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.appointmentDate);
      // Compare dates to see if appointment is today or in the future
      return (appointmentDate.getTime() >= today.setHours(0, 0, 0, 0)) && 
             a.status !== 'cancelled' && 
             a.status !== 'completed';
    });

    // Calculate appointment pending amount - ONLY for today and past unpaid appointments
    const pendingAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.appointmentDate);
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      
      // Only include appointments that are:
      // 1. Today or in the past (appointmentDate <= today)
      // 2. Not completed or cancelled
      return appointmentDate <= todayStart && 
             (a.status === 'scheduled' || a.status === 'confirmed');
    });
    
    const appointmentPendingAmount = pendingAppointments.reduce((sum, a) => sum + a.totalAmount, 0);

    // Calculate today's stats from completed transactions only
    const totalIncome = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalServices = todayTransactions.reduce((sum, t) => sum + t.services.length, 0);
    const totalCommissions = todayTransactions.reduce((sum, t) => 
      sum + t.commissions.reduce((commSum, c) => commSum + c.amount, 0), 0
    );

    // Pending services amount
    const pendingServicesAmount = pendingServices.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPendingAmount = pendingServicesAmount + appointmentPendingAmount;

    // Payment methods from today's completed transactions only
    const paymentMethods = todayTransactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.totalAmount;
      return acc;
    }, { cash: 0, transfer: 0, card: 0 });

    setStats({
      totalIncome,
      totalServices,
      totalCommissions,
      pendingServices: pendingServices.length + pendingAppointments.length,
      pendingAmount: totalPendingAmount,
      appointmentCount: upcomingAppointments.length,
      paymentMethods
    });
  }, [user, refreshTrigger]);

  return (
    <div className="bg-black min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold">CARWASH MANAGER</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Reminder Bell */}
            {reminders.length > 0 && (
              <button
                onClick={() => setShowReminders(true)}
                className="relative w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <Bell size={18} className="text-black" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                  {reminders.length}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-gray-400 text-xs">{mn.welcomeBack}</p>
          <h2 className="text-white text-lg font-bold">{user?.businessName}</h2>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="px-4 mb-4">
        <h2 className="text-white text-lg font-bold mb-3">{mn.performanceToday}</h2>
        
        {/* Main Sales Card - Full Width - Clickable with Enhanced Animation */}
        <button
          onClick={() => setShowPaymentChart(true)}
          className="w-full mb-3 text-left group"
        >
          <div className="bg-green-500 text-black p-4 rounded-xl relative overflow-hidden hover:bg-green-400 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-black/20 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full transform -translate-x-6 translate-y-6 group-hover:scale-125 transition-transform duration-500 ease-out"></div>
            </div>
            
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div>
                <h3 className="font-bold text-lg">{mn.totalSales}</h3>
              </div>
              {/* Enhanced Trending Up Icon with Bigger Animation Background */}
              <div className="relative">
                {/* Large Animated Background Circle */}
                <div className="absolute inset-0 w-16 h-16 -m-4 bg-black/10 rounded-full group-hover:bg-black/20 group-hover:scale-150 transition-all duration-500 ease-out"></div>
                {/* Medium Pulse Ring */}
                <div className="absolute inset-0 w-12 h-12 -m-2 bg-black/5 rounded-full group-hover:scale-125 group-hover:bg-black/15 transition-all duration-400 ease-out"></div>
                {/* Icon Container */}
                <div className="bg-black/10 p-2 rounded-full relative z-10 group-hover:bg-black/20 group-hover:scale-110 transition-all duration-300 ease-out">
                  <TrendingUp size={20} className="group-hover:scale-110 transition-transform duration-300 ease-out" />
                </div>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold relative z-10 break-words leading-tight">
              ₮{stats.totalIncome.toLocaleString()}
            </div>
            
            {/* Subtle Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          </div>
        </button>

        {/* Secondary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Pending Card - Clickable with Animation */}
          <button
            onClick={() => setShowPendingServices(true)}
            className="text-left group"
          >
            <div className="bg-yellow-400 text-black p-3 rounded-xl relative overflow-hidden hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95">
              {/* Animated Background Elements */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-black/10 rounded-full transform translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-500 ease-out"></div>
              
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm truncate">Хүлээгдэж буй</h3>
                  <p className="text-xs opacity-80 truncate">Төлбөр + Цаг</p>
                </div>
                <div className="bg-black/10 p-1.5 rounded-full group-hover:bg-black/20 group-hover:scale-110 transition-all duration-300 flex-shrink-0 ml-2">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold relative z-10 break-words leading-tight">
                ₮{stats.pendingAmount.toLocaleString()}
              </div>
              <div className="text-xs opacity-70 mt-1 relative z-10 truncate">
                {stats.pendingServices} хүлээгдэж буй
              </div>
            </div>
          </button>
          
          {/* Appointment Count Card - Clickable with Animation */}
          <button
            onClick={() => setShowAppointments(true)}
            className="text-left group"
          >
            <div className="bg-blue-500 text-white p-3 rounded-xl relative overflow-hidden hover:bg-blue-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95">
              {/* Animated Background Elements */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full transform translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-500 ease-out"></div>
              
              <div className="flex items-center justify-center mb-2 relative z-10">
                <div className="bg-white/10 p-1.5 rounded-full group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                  <Calendar size={16} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold relative z-10 text-center break-words">
                {stats.appointmentCount}
              </div>
              <div className="text-xs opacity-70 mt-1 relative z-10 text-center">
                цаг захиалга
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Total Commissions Card - Updated to match Total Services styling with responsive text */}
          <div className="bg-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center">
            <h3 className="text-gray-400 text-xs mb-2 truncate">Өнөөдрийн цалин</h3>
            <p className="text-white text-lg sm:text-xl lg:text-2xl font-bold break-words leading-tight">₮{stats.totalCommissions.toLocaleString()}</p>
          </div>
          
          {/* Total Services Card - Updated to responsive text */}
          <div className="bg-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center">
            <h3 className="text-gray-400 text-xs mb-2 truncate">{mn.totalServices}</h3>
            <p className="text-white text-xl sm:text-2xl font-bold break-words">{stats.totalServices}</p>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Bottom Right Corner */}
      <button
        onClick={onNewTransaction}
        className="fixed bottom-24 right-4 w-14 h-14 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl hover:shadow-3xl z-40 group"
      >
        {/* Animated Background Ring */}
        <div className="absolute inset-0 bg-green-500/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
        
        {/* Plus Icon with Rotation Animation */}
        <Plus 
          size={28} 
          className="text-black relative z-10 group-hover:rotate-90 transition-transform duration-300 ease-out" 
        />
        
        {/* Pulse Ring Animation */}
        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
      </button>

      {/* Payment Chart Modal */}
      {showPaymentChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-lg font-bold">Төлбөрийн хэрэгсэл</h2>
                <button
                  onClick={() => setShowPaymentChart(false)}
                  className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <PaymentChart stats={stats} isModal={true} />
            </div>
          </div>
        </div>
      )}

      {/* Pending Services Modal */}
      {showPendingServices && (
        <PendingServicesList onClose={() => setShowPendingServices(false)} />
      )}

      {/* Appointments Modal */}
      {showAppointments && (
        <AppointmentsList onClose={() => setShowAppointments(false)} />
      )}

      {/* Appointment Reminders Modal */}
      {showReminders && reminders.length > 0 && (
        <AppointmentReminders
          reminders={reminders}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setShowReminders(false)}
        />
      )}
    </div>
  );
};

export default DashboardView;