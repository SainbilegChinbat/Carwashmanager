import { 
  User, 
  Service, 
  Employee, 
  Transaction, 
  PendingService, 
  Appointment, 
  AppointmentReminder,
  Commission
} from '../types';
import { 
  getServices as getSupabaseServices,
  getEmployees as getSupabaseEmployees,
  getTransactions as getSupabaseTransactions,
  getPendingServices as getSupabasePendingServices,
  getAppointments as getSupabaseAppointments,
  getActiveReminders as getSupabaseActiveReminders,
  saveService as saveSupabaseService,
  saveEmployee as saveSupabaseEmployee,
  saveTransaction as saveSupabaseTransaction,
  savePendingService as saveSupabasePendingService,
  saveAppointment as saveSupabaseAppointment,
  deleteService as deleteSupabaseService,
  deleteEmployee as deleteSupabaseEmployee,
  deleteTransaction as deleteSupabaseTransaction,
  deletePendingService as deleteSupabasePendingService,
  deleteAppointment as deleteSupabaseAppointment,
  updateAppointmentStatus as updateSupabaseAppointmentStatus,
  completeAppointment as completeSupabaseAppointment,
  completePendingService as completeSupabasePendingService,
  markReminderAsRead as markSupabaseReminderAsRead,
  markEmployeeCommissionAsPaid as markSupabaseEmployeeCommissionAsPaid,
  isLicensePlateAvailableToday as isSupabaseLicensePlateAvailableToday,
  getLicensePlateConflictMessage as getSupabaseLicensePlateConflictMessage,
  getDashboardStats as getSupabaseDashboardStats,
  getTransactionsByDateRange as getSupabaseTransactionsByDateRange,
  getEmployeeStats as getSupabaseEmployeeStats,
  getServiceStats as getSupabaseServiceStats,
  getUnpaidCommissions as getSupabaseUnpaidCommissions,
  updateServiceCategory as updateSupabaseServiceCategory,
  deleteServiceCategory as deleteSupabaseServiceCategory,
  getServiceCategories as getSupabaseServiceCategories
} from '../services/supabaseService';

import {
  getServices as getLocalServices,
  getEmployees as getLocalEmployees,
  getTransactions as getLocalTransactions,
  getPendingServices as getLocalPendingServices,
  getAppointments as getLocalAppointments,
  getActiveReminders as getLocalActiveReminders,
  saveService as saveLocalService,
  saveEmployee as saveLocalEmployee,
  saveTransaction as saveLocalTransaction,
  savePendingService as saveLocalPendingService,
  saveAppointment as saveLocalAppointment,
  deleteService as deleteLocalService,
  deleteEmployee as deleteLocalEmployee,
  deleteTransaction as deleteLocalTransaction,
  deletePendingService as deleteLocalPendingService,
  deleteAppointment as deleteLocalAppointment,
  updateAppointmentStatus as updateLocalAppointmentStatus,
  completeAppointment as completeLocalAppointment,
  completePendingService as completeLocalPendingService,
  markReminderAsRead as markLocalReminderAsRead,
  markEmployeeCommissionAsPaid as markLocalEmployeeCommissionAsPaid,
  isLicensePlateAvailableToday as isLocalLicensePlateAvailableToday,
  getLicensePlateConflictMessage as getLocalLicensePlateConflictMessage,
  updateServiceCategory as updateLocalServiceCategory,
  deleteServiceCategory as deleteLocalServiceCategory,
  getServiceCategories as getLocalServiceCategories
} from '../utils/storage';

import { isSupabaseConfigured } from '../utils/supabaseClient';

// Flag to determine if we should use Supabase or local storage
const useSupabase = isSupabaseConfigured;

// Services
export const getServices = async (userId: string): Promise<Service[]> => {
  if (useSupabase) {
    return await getSupabaseServices(userId);
  } else {
    return getLocalServices(userId);
  }
};

export const saveService = async (service: Service): Promise<boolean> => {
  console.log('dataUtils: saveService called. Initial useSupabase value:', useSupabase);
  console.log('dataUtils: saveService called. Using Supabase:', useSupabase);
  console.log('dataUtils: service object:', service);
  if (useSupabase) {
    // Check if we have a valid session before proceeding
    const { data } = await supabase.auth.getSession();
    console.log('dataUtils: Session data from getSession():', data.session);
    console.log('dataUtils: Session data from getSession():', data.session);
    if (!data.session) {
      console.error('dataUtils: No valid session found, cannot save service');
      return false;
    }
    console.log('dataUtils: Calling saveSupabaseService with:', service);
    return await saveSupabaseService(service);
  } else {
    console.log('dataUtils: Calling saveLocalService with:', service);
    return saveLocalService(service);
  }
};

export const deleteService = async (serviceId: string): Promise<boolean> => {
  if (useSupabase) {
    return await deleteSupabaseService(serviceId);
  } else {
    return deleteLocalService(serviceId);
  }
};

// Category management
export const updateServiceCategory = async (oldCategory: string, newCategory: string, userId: string): Promise<boolean> => {
  if (useSupabase) {
    return await updateSupabaseServiceCategory(oldCategory, newCategory, userId);
  } else {
    return updateLocalServiceCategory(oldCategory, newCategory, userId);
  }
};

export const deleteServiceCategory = async (categoryToDelete: string, newCategoryForServices: string, userId: string): Promise<boolean> => {
  if (useSupabase) {
    return await deleteSupabaseServiceCategory(categoryToDelete, newCategoryForServices, userId);
  } else {
    return deleteLocalServiceCategory(categoryToDelete, newCategoryForServices, userId);
  }
};

export const getServiceCategories = async (userId: string): Promise<string[]> => {
  if (useSupabase) {
    // Force fresh data fetch from Supabase
    try {
      const categories = await getSupabaseServiceCategories(userId);
      console.log('Fetched categories from Supabase:', categories);
      return categories;
    } catch (error) {
      console.error('Error fetching categories from Supabase:', error);
      return ['Ерөнхий'];
    }
  } else {
    return getLocalServiceCategories(userId);
  }
};

// Employees
export const getEmployees = async (userId: string): Promise<Employee[]> => {
  if (useSupabase) {
    return await getSupabaseEmployees(userId);
  } else {
    return getLocalEmployees(userId);
  }
};

export const saveEmployee = async (employee: Employee): Promise<boolean> => {
  if (useSupabase) {
    return await saveSupabaseEmployee(employee);
  } else {
    return saveLocalEmployee(employee);
  }
};

export const deleteEmployee = async (employeeId: string): Promise<boolean> => {
  if (useSupabase) {
    return await deleteSupabaseEmployee(employeeId);
  } else {
    return deleteLocalEmployee(employeeId);
  }
};

// Transactions
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  if (useSupabase) {
    return await getSupabaseTransactions(userId);
  } else {
    return getLocalTransactions(userId);
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<boolean> => {
  if (useSupabase) {
    return await saveSupabaseTransaction(transaction);
  } else {
    return saveLocalTransaction(transaction);
  }
};

export const deleteTransaction = async (transactionId: string): Promise<boolean> => {
  if (useSupabase) {
    return await deleteSupabaseTransaction(transactionId);
  } else {
    return deleteLocalTransaction(transactionId);
  }
};

export const markEmployeeCommissionAsPaid = async (
  employeeId: string, 
  transactionIds: string[], 
  notes: string
): Promise<boolean> => {
  if (useSupabase) {
    return await markSupabaseEmployeeCommissionAsPaid(employeeId, transactionIds, notes);
  } else {
    return markLocalEmployeeCommissionAsPaid(employeeId, transactionIds, notes);
  }
};

// Pending services
export const getPendingServices = async (userId: string): Promise<PendingService[]> => {
  if (useSupabase) {
    return await getSupabasePendingServices(userId);
  } else {
    return getPendingServices(userId);
  }
};

export const savePendingService = async (pendingService: PendingService): Promise<boolean> => {
  if (useSupabase) {
    return await saveSupabasePendingService(pendingService);
  } else {
    return saveLocalPendingService(pendingService);
  }
};

export const deletePendingService = async (pendingServiceId: string): Promise<boolean> => {
  if (useSupabase) {
    return await deleteSupabasePendingService(pendingServiceId);
  } else {
    return deleteLocalPendingService(pendingServiceId);
  }
};

export const completePendingService = async (
  pendingServiceId: string, 
  paymentMethod: 'cash' | 'transfer' | 'card'
): Promise<boolean> => {
  if (useSupabase) {
    return await completeSupabasePendingService(pendingServiceId, paymentMethod);
  } else {
    return completeLocalPendingService(pendingServiceId, paymentMethod);
  }
};

// Appointments
export const getAppointments = async (userId: string): Promise<Appointment[]> => {
  if (useSupabase) {
    return await getSupabaseAppointments(userId);
  } else {
    return getLocalAppointments(userId);
  }
};

export const saveAppointment = async (appointment: Appointment): Promise<boolean> => {
  if (useSupabase) {
    return await saveSupabaseAppointment(appointment);
  } else {
    return saveLocalAppointment(appointment);
  }
};

export const updateAppointmentStatus = async (
  appointmentId: string, 
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
): Promise<boolean> => {
  if (useSupabase) {
    return await updateSupabaseAppointmentStatus(appointmentId, status);
  } else {
    return updateLocalAppointmentStatus(appointmentId, status);
  }
};

export const completeAppointment = async (
  appointmentId: string, 
  paymentMethod: 'cash' | 'transfer' | 'card'
): Promise<boolean> => {
  if (useSupabase) {
    return await completeSupabaseAppointment(appointmentId, paymentMethod);
  } else {
    return completeLocalAppointment(appointmentId, paymentMethod);
  }
};

export const deleteAppointment = async (appointmentId: string): Promise<boolean> => {
  if (useSupabase) {
    return await deleteSupabaseAppointment(appointmentId);
  } else {
    return deleteLocalAppointment(appointmentId);
  }
};

// Appointment reminders
export const getActiveReminders = async (userId: string): Promise<AppointmentReminder[]> => {
  if (useSupabase) {
    return await getSupabaseActiveReminders(userId);
  } else {
    return getLocalActiveReminders(userId);
  }
};

export const markReminderAsRead = async (reminderId: string): Promise<boolean> => {
  if (useSupabase) {
    return await markSupabaseReminderAsRead(reminderId);
  } else {
    return markLocalReminderAsRead(reminderId);
  }
};

// License plate availability
export const isLicensePlateAvailableToday = async (
  licensePlate: string, 
  userId: string, 
  excludeId?: string,
  checkDate?: string
): Promise<boolean> => {
  if (useSupabase) {
    return await isSupabaseLicensePlateAvailableToday(licensePlate, userId, excludeId, checkDate);
  } else {
    return isLocalLicensePlateAvailableToday(licensePlate, userId, excludeId, checkDate);
  }
};

export const getLicensePlateConflictMessage = async (
  licensePlate: string, 
  userId: string,
  checkDate?: string
): Promise<string> => {
  if (useSupabase) {
    return await getSupabaseLicensePlateConflictMessage(licensePlate, userId, checkDate);
  } else {
    return getLocalLicensePlateConflictMessage(licensePlate, userId, checkDate);
  }
};

// Dashboard statistics
export const getDashboardStats = async (userId: string): Promise<any> => {
  if (useSupabase) {
    return await getSupabaseDashboardStats(userId);
  } else {
    // Local implementation - this is a placeholder
    // In the real implementation, we would need to calculate these stats from local storage
    const transactions = getLocalTransactions(userId);
    const pendingServices = getLocalPendingServices(userId);
    const appointments = getLocalAppointments(userId);
    
    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Filter today's completed transactions
    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= today && 
             transactionDate < tomorrow && 
             t.status === 'completed';
    });
    
    // Count upcoming appointments (not completed or cancelled)
    const upcomingAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.appointmentDate);
      return appointmentDate >= today && 
             a.status !== 'cancelled' && 
             a.status !== 'completed';
    });
    
    // Calculate appointment pending amount - ONLY for today and past unpaid appointments
    const pendingAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.appointmentDate);
      appointmentDate.setHours(0, 0, 0, 0);
      
      return appointmentDate <= today && 
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
    
    return {
      totalIncome,
      totalServices,
      totalCommissions,
      pendingServices: pendingServices.length + pendingAppointments.length,
      pendingAmount: totalPendingAmount,
      appointmentCount: upcomingAppointments.length,
      paymentMethods
    };
  }
};

// Report services
export const getTransactionsByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<Transaction[]> => {
  if (useSupabase) {
    return await getSupabaseTransactionsByDateRange(userId, startDate, endDate);
  } else {
    // Local implementation
    const transactions = getLocalTransactions(userId);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
  }
};

export const getEmployeeStats = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<any[]> => {
  if (useSupabase) {
    return await getSupabaseEmployeeStats(userId, startDate, endDate);
  } else {
    // Local implementation - this is a placeholder
    // In the real implementation, we would need to calculate these stats from local storage
    const employees = getLocalEmployees(userId);
    const transactions = getLocalTransactions(userId);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Filter transactions by date range
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });
    
    // Calculate employee stats
    return employees.map(employee => {
      // Find transactions where this employee was involved
      const employeeTransactions = filteredTransactions.filter(t => 
        t.employees.includes(employee.id)
      );
      
      // Calculate total commissions
      const totalCommissions = filteredTransactions.reduce((sum, t) => {
        const employeeCommissions = t.commissions.filter(c => c.employeeId === employee.id);
        return sum + employeeCommissions.reduce((commSum, c) => commSum + c.amount, 0);
      }, 0);
      
      // Calculate revenue share
      const totalRevenue = employeeTransactions.reduce((sum, t) => 
        sum + (t.totalAmount / t.employees.length), 0
      );
      
      // Count paid and unpaid commissions
      const paidCommissions = filteredTransactions.reduce((count, t) => {
        const paidCount = t.commissions.filter(c => 
          c.employeeId === employee.id && c.isPaid
        ).length;
        return count + paidCount;
      }, 0);
      
      const unpaidCommissions = filteredTransactions.reduce((count, t) => {
        const unpaidCount = t.commissions.filter(c => 
          c.employeeId === employee.id && !c.isPaid
        ).length;
        return count + unpaidCount;
      }, 0);
      
      return {
        'Ажилтны нэр': employee.name,
        'Нийт цалин': totalCommissions,
        'Үйлчилгээний тоо': employeeTransactions.reduce((sum, t) => sum + t.services.length, 0),
        'Орлогын хувь': totalRevenue,
        'Цалин олгосон': paidCommissions,
        'Цалин олгоогүй': unpaidCommissions,
        'employeeId': employee.id
      };
    });
  }
};

export const getServiceStats = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<any[]> => {
  if (useSupabase) {
    return await getSupabaseServiceStats(userId, startDate, endDate);
  } else {
    // Local implementation - this is a placeholder
    // In the real implementation, we would need to calculate these stats from local storage
    const transactions = getLocalTransactions(userId);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Filter transactions by date range
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });
    
    // Group services
    const serviceData: { [key: string]: any } = {};
    
    filteredTransactions.forEach(transaction => {
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
    
    // Calculate average price
    Object.values(serviceData).forEach((service: any) => {
      service['Дундаж үнэ'] = service['Нийт орлого'] / service['Хийгдсэн тоо'];
    });
    
    return Object.values(serviceData);
  }
};

// Employee commission details
export const getUnpaidCommissions = async (employeeId: string): Promise<Commission[]> => {
  if (useSupabase) {
    return await getSupabaseUnpaidCommissions(employeeId);
  } else {
    // Local implementation
    const transactions = getLocalTransactions();
    
    const unpaidCommissions: Commission[] = [];
    
    transactions.forEach(transaction => {
      transaction.commissions.forEach(commission => {
        if (commission.employeeId === employeeId && !commission.isPaid) {
          unpaidCommissions.push({
            ...commission,
            id: `${transaction.id}_${commission.employeeId}`
          });
        }
      });
    });
    
    return unpaidCommissions;
  }
};
// src/utils/dataUtils.ts дотор, getServices функцэд:
export const getServices = async (userId: string): Promise<Service[]> => {
  console.log("Attempting to get services for userId:", userId);
  console.log("dataUtils: getServices called. Using Supabase:", useSupabase);
  if (useSupabase) {
    const data = await getSupabaseServices(userId);
    console.log("Supabase services data:", data);
    return data;
  } else {
    const data = getLocalServices(userId);
    console.log("Local services data:", data);
    return data;
  }
};
