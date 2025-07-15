import { User, Transaction, Service, Employee, Appointment, PendingService, AppointmentReminder } from '../types';

// Storage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'carwash_current_user',
  USERS: 'carwash_users',
  TRANSACTIONS: 'carwash_transactions',
  SERVICES: 'carwash_services',
  EMPLOYEES: 'carwash_employees',
  APPOINTMENTS: 'carwash_appointments',
  PENDING_SERVICES: 'carwash_pending_services',
  APPOINTMENT_REMINDERS: 'carwash_appointment_reminders'
};

// Migration function to fix historical commission rates and migrate to new structure
const migrateHistoricalCommissionRates = (): void => {
  try {
    const transactionsStr = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const employeesStr = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    
    if (!transactionsStr || !employeesStr) return;
    
    const transactions: Transaction[] = JSON.parse(transactionsStr);
    const employees: Employee[] = JSON.parse(employeesStr);
    
    let hasChanges = false;
    
    // Update transactions that don't have commissionRate in their commissions or need migration
    const updatedTransactions = transactions.map(transaction => {
      let needsUpdate = false;
      
      // Check if any commission is missing commissionRate, isPaid, or notes
      if (transaction.commissions && transaction.commissions.length > 0) {
        const needsCommissionUpdate = transaction.commissions.some(commission => 
          commission.commissionRate === undefined || commission.commissionRate === null ||
          commission.isPaid === undefined || commission.notes === undefined
        );
        
        if (needsCommissionUpdate) {
          needsUpdate = true;
        }
      }
      
      // Check if transaction has old fields that need to be migrated
      const hasOldFields = (transaction as any).isCommissionPaid !== undefined || 
                          (transaction as any).commissionNotes !== undefined;
      
      if (hasOldFields) {
        needsUpdate = true;
      }
      
      if (!needsUpdate) {
        return transaction;
      }
      
      hasChanges = true;
      
      // Update commissions with employee's default commission rate and new fields
      const updatedCommissions = transaction.commissions?.map(commission => {
        // Find the employee and use their default commission rate if missing
        const employee = employees.find(emp => emp.id === commission.employeeId);
        const commissionRate = commission.commissionRate ?? (employee ? employee.defaultCommissionRate : 15);
        
        // Migrate old transaction-level fields to commission level
        const oldTransaction = transaction as any;
        const isPaid = commission.isPaid ?? (oldTransaction.isCommissionPaid || false);
        const notes = commission.notes ?? (oldTransaction.commissionNotes || '');
        
        return {
          ...commission,
          commissionRate,
          isPaid,
          notes
        };
      }) || [];
      
      // Remove old fields and return updated transaction
      const { isCommissionPaid, commissionNotes, ...cleanTransaction } = transaction as any;
      
      return {
        ...cleanTransaction,
        commissions: updatedCommissions
      };
    });
    
    // Save updated transactions if there were changes
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
      console.log('Historical commission rates and structure have been migrated successfully');
    }
  } catch (error) {
    console.error('Error migrating historical commission rates:', error);
  }
};

// User authentication functions
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const setCurrentUser = (user: User): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error setting current user:', error);
  }
};

export const logout = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

export const authenticateUser = (email: string, password: string): User | null => {
  try {
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: (User & { password: string })[] = usersStr ? JSON.parse(usersStr) : [];
    
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      
      // Run migration when user logs in
      migrateHistoricalCommissionRates();
      
      return userWithoutPassword;
    }
    
    return null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
};

export const registerUser = (userData: User & { password: string }): boolean => {
  try {
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: (User & { password: string })[] = usersStr ? JSON.parse(usersStr) : [];
    
    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
      console.log('User already exists with this email');
      return false;
    }
    
    // Add new user
    const newUser = {
      ...userData,
      id: userData.id || Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    return true;
  } catch (error) {
    console.error('Error registering user:', error);
    return false;
  }
};

export const updateUserProfile = (userData: User): boolean => {
  try {
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: (User & { password?: string })[] = usersStr ? JSON.parse(usersStr) : [];
    
    const userIndex = users.findIndex(u => u.id === userData.id);
    if (userIndex === -1) {
      console.log('User not found for profile update');
      return false;
    }
    
    // Update user data while preserving password
    users[userIndex] = {
      ...users[userIndex],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Update current user if it's the same user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userData.id) {
      setCurrentUser(userData);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// Reset password by email (for forgot password functionality)
export const resetUserPasswordByEmail = (email: string, newPassword: string): boolean => {
  try {
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: (User & { password: string })[] = usersStr ? JSON.parse(usersStr) : [];
    
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) {
      return false; // User not found
    }
    
    users[userIndex].password = newPassword;
    users[userIndex].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    return true;
  } catch (error) {
    console.error('Error resetting user password:', error);
    return false;
  }
};

// Check if email exists in the system
export const checkEmailExists = (email: string): boolean => {
  try {
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: (User & { password: string })[] = usersStr ? JSON.parse(usersStr) : [];
    
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
};

// Transaction functions
export const getTransactions = (userId?: string): Transaction[] => {
  try {
    const transactionsStr = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    let transactions: Transaction[] = transactionsStr ? JSON.parse(transactionsStr) : [];
    
    // Convert date strings back to Date objects
    transactions = transactions.map(transaction => ({
      ...transaction,
      date: new Date(transaction.date)
    }));
    
    // Sort transactions by date in descending order (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (userId) {
      return transactions.filter(t => t.userId === userId);
    }
    
    return transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

export const saveTransaction = (transaction: Transaction): boolean => {
  try {
    const transactions = getTransactions();
    
    // Ensure transaction.date is a Date object
    const transactionToSave = {
      ...transaction,
      date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date)
    };
    
    const existingIndex = transactions.findIndex(t => t.id === transactionToSave.id);
    
    // Ensure commissions have default values for new fields
    const transactionWithDefaults = {
      ...transactionToSave,
      commissions: transactionToSave.commissions.map(commission => ({
        ...commission,
        isPaid: commission.isPaid ?? false,
        notes: commission.notes ?? ''
      }))
    };
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transactionWithDefaults;
    } else {
      transactions.push(transactionWithDefaults);
    }
    
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error('Error saving transaction:', error);
    return false;
  }
};

export const deleteTransaction = (transactionId: string): boolean => {
  try {
    const transactions = getTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== transactionId);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filteredTransactions));
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
};

// Mark employee commission as paid for specific transactions
export const markEmployeeCommissionAsPaid = (employeeId: string, transactionIds: string[], notes: string): boolean => {
  try {
    const transactions = getTransactions();
    let hasChanges = false;
    
    const updatedTransactions = transactions.map(transaction => {
      if (transactionIds.includes(transaction.id)) {
        // Check if this transaction has commissions for the specified employee
        const hasEmployeeCommission = transaction.commissions.some(c => c.employeeId === employeeId);
        
        if (hasEmployeeCommission) {
          hasChanges = true;
          
          // Update only the specific employee's commission
          const updatedCommissions = transaction.commissions.map(commission => {
            if (commission.employeeId === employeeId) {
              return {
                ...commission,
                isPaid: true,
                notes: notes
              };
            }
            return commission;
          });
          
          return {
            ...transaction,
            commissions: updatedCommissions
          };
        }
      }
      return transaction;
    });
    
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error marking employee commission as paid:', error);
    return false;
  }
};

// Service functions
export const getServices = (userId?: string): Service[] => {
  try {
    const servicesStr = localStorage.getItem(STORAGE_KEYS.SERVICES);
    const services: Service[] = servicesStr ? JSON.parse(servicesStr) : [];
    
    if (userId) {
      return services.filter(s => s.userId === userId);
    }
    
    return services;
  } catch (error) {
    console.error('Error getting services:', error);
    return [];
  }
};

export const saveService = (service: Service): boolean => {
  try {
    const services = getServices();
    const existingIndex = services.findIndex(s => s.id === service.id);
    
    // Ensure service has a category
    const serviceWithCategory = {
      ...service,
      category: service.category || 'Ерөнхий'
    };
    
    if (existingIndex >= 0) {
      services[existingIndex] = serviceWithCategory;
    } else {
      services.push(serviceWithCategory);
    }
    
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    return true;
  } catch (error) {
    console.error('Error saving service:', error);
    return false;
  }
};

export const deleteService = (serviceId: string): boolean => {
  try {
    const services = getServices();
    const filteredServices = services.filter(s => s.id !== serviceId);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(filteredServices));
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    return false;
  }
};

// Category management functions
export const updateServiceCategory = (oldCategory: string, newCategory: string, userId: string): boolean => {
  try {
    const services = getServices();
    let hasChanges = false;
    
    const updatedServices = services.map(service => {
      if (service.userId === userId && (service.category || 'Ерөнхий') === oldCategory) {
        hasChanges = true;
        return {
          ...service,
          category: newCategory
        };
      }
      return service;
    });
    
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updatedServices));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating service category:', error);
    return false;
  }
};

export const deleteServiceCategory = (categoryToDelete: string, newCategoryForServices: string, userId: string): boolean => {
  try {
    const services = getServices();
    let hasChanges = false;
    
    const updatedServices = services.map(service => {
      if (service.userId === userId && (service.category || 'Ерөнхий') === categoryToDelete) {
        hasChanges = true;
        return {
          ...service,
          category: newCategoryForServices
        };
      }
      return service;
    });
    
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updatedServices));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting service category:', error);
    return false;
  }
};

export const getServiceCategories = (userId: string): string[] => {
  try {
    const services = getServices(userId);
    const categories = new Set(services.map(s => s.category || 'Ерөнхий'));
    return Array.from(categories).sort((a, b) => {
      if (a === 'Ерөнхий') return -1;
      if (b === 'Ерөнхий') return 1;
      return a.localeCompare(b);
    });
  } catch (error) {
    console.error('Error getting service categories:', error);
    return ['Ерөнхий'];
  }
};

// Employee functions
export const getEmployees = (userId?: string): Employee[] => {
  try {
    const employeesStr = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    const employees: Employee[] = employeesStr ? JSON.parse(employeesStr) : [];
    
    if (userId) {
      return employees.filter(e => e.userId === userId);
    }
    
    return employees;
  } catch (error) {
    console.error('Error getting employees:', error);
    return [];
  }
};

export const saveEmployee = (employee: Employee): boolean => {
  try {
    const employees = getEmployees();
    const existingIndex = employees.findIndex(e => e.id === employee.id);
    
    if (existingIndex >= 0) {
      employees[existingIndex] = employee;
    } else {
      employees.push(employee);
    }
    
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    return true;
  } catch (error) {
    console.error('Error saving employee:', error);
    return false;
  }
};

export const deleteEmployee = (employeeId: string): boolean => {
  try {
    const employees = getEmployees();
    const filteredEmployees = employees.filter(e => e.id !== employeeId);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filteredEmployees));
    return true;
  } catch (error) {
    console.error('Error deleting employee:', error);
    return false;
  }
};

// Appointment functions
export const getAppointments = (userId?: string): Appointment[] => {
  try {
    const appointmentsStr = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    const appointments: Appointment[] = appointmentsStr ? JSON.parse(appointmentsStr) : [];
    
    if (userId) {
      return appointments.filter(a => a.userId === userId);
    }
    
    return appointments;
  } catch (error) {
    console.error('Error getting appointments:', error);
    return [];
  }
};

export const saveAppointment = (appointment: Appointment): boolean => {
  try {
    const appointments = getAppointments();
    const existingIndex = appointments.findIndex(a => a.id === appointment.id);
    
    if (existingIndex >= 0) {
      appointments[existingIndex] = appointment;
    } else {
      appointments.push(appointment);
    }
    
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    return true;
  } catch (error) {
    console.error('Error saving appointment:', error);
    return false;
  }
};

export const updateAppointmentStatus = (appointmentId: string, status: Appointment['status']): boolean => {
  try {
    const appointments = getAppointments();
    const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
    
    if (appointmentIndex >= 0) {
      appointments[appointmentIndex].status = status;
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return false;
  }
};

export const completeAppointment = (appointmentId: string, paymentMethod: 'cash' | 'transfer' | 'card'): boolean => {
  try {
    const appointments = getAppointments();
    const appointment = appointments.find(a => a.id === appointmentId);
    
    if (appointment) {
      // Convert to completed transaction
      const transaction: Transaction = {
        id: Date.now().toString(),
        licensePlate: appointment.licensePlate,
        services: appointment.services,
        employees: appointment.employees,
        paymentMethod: paymentMethod,
        totalAmount: appointment.totalAmount,
        commissions: appointment.commissions.map(commission => ({
          ...commission,
          isPaid: false, // Default to false for new transactions
          notes: '' // Default to empty string
        })),
        date: new Date(),
        userId: appointment.userId,
        status: 'completed',
        notes: appointment.notes
      };
      
      // Save as transaction and update appointment status
      saveTransaction(transaction);
      updateAppointmentStatus(appointmentId, 'completed');
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error completing appointment:', error);
    return false;
  }
};

export const deleteAppointment = (appointmentId: string): boolean => {
  try {
    const appointments = getAppointments();
    const filteredAppointments = appointments.filter(a => a.id !== appointmentId);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filteredAppointments));
    
    // Also delete related reminders
    deleteRemindersByAppointmentId(appointmentId);
    
    return true;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return false;
  }
};

// Pending services functions
export const getPendingServices = (userId?: string): PendingService[] => {
  try {
    const pendingStr = localStorage.getItem(STORAGE_KEYS.PENDING_SERVICES);
    const pendingServices: PendingService[] = pendingStr ? JSON.parse(pendingStr) : [];
    
    if (userId) {
      return pendingServices.filter(p => p.userId === userId);
    }
    
    return pendingServices;
  } catch (error) {
    console.error('Error getting pending services:', error);
    return [];
  }
};

export const savePendingService = (pendingService: PendingService): boolean => {
  try {
    const pendingServices = getPendingServices();
    const existingIndex = pendingServices.findIndex(p => p.id === pendingService.id);
    
    if (existingIndex >= 0) {
      pendingServices[existingIndex] = pendingService;
    } else {
      pendingServices.push(pendingService);
    }
    
    localStorage.setItem(STORAGE_KEYS.PENDING_SERVICES, JSON.stringify(pendingServices));
    return true;
  } catch (error) {
    console.error('Error saving pending service:', error);
    return false;
  }
};

export const completePendingService = (pendingServiceId: string, paymentMethod: 'cash' | 'transfer' | 'card'): boolean => {
  try {
    const pendingServices = getPendingServices();
    const pendingService = pendingServices.find(p => p.id === pendingServiceId);
    
    if (pendingService) {
      // Convert to completed transaction
      const transaction: Transaction = {
        id: Date.now().toString(),
        licensePlate: pendingService.licensePlate,
        services: pendingService.services,
        employees: pendingService.employees,
        paymentMethod: paymentMethod,
        totalAmount: pendingService.totalAmount,
        commissions: pendingService.commissions.map(commission => ({
          ...commission,
          isPaid: false, // Default to false for new transactions
          notes: '' // Default to empty string
        })),
        date: new Date(),
        userId: pendingService.userId,
        status: 'completed',
        notes: pendingService.notes
      };
      
      // Save as transaction and remove from pending
      saveTransaction(transaction);
      deletePendingService(pendingServiceId);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error completing pending service:', error);
    return false;
  }
};

export const deletePendingService = (pendingServiceId: string): boolean => {
  try {
    const pendingServices = getPendingServices();
    const filteredPendingServices = pendingServices.filter(p => p.id !== pendingServiceId);
    localStorage.setItem(STORAGE_KEYS.PENDING_SERVICES, JSON.stringify(filteredPendingServices));
    return true;
  } catch (error) {
    console.error('Error deleting pending service:', error);
    return false;
  }
};

// License plate availability functions
export const isLicensePlateAvailableToday = (licensePlate: string, userId: string, excludeId?: string, checkDate?: string): boolean => {
  try {
    // Use provided date or default to today
    let targetDate;
    if (checkDate) {
      // Parse the date string into a Date object
      const [year, month, day] = checkDate.split('-').map(Number);
      targetDate = new Date(year, month - 1, day).toDateString();
    } else {
      targetDate = new Date().toDateString();
    }
    
    // Check transactions
    const transactions = getTransactions(userId);
    const targetDateTransactions = transactions.filter(t => 
      t.licensePlate.toLowerCase() === licensePlate.toLowerCase() &&
      t.date.toDateString() === targetDate &&
      t.id !== excludeId
    );
    
    // Check pending services
    const pendingServices = getPendingServices(userId);
    const targetDatePending = pendingServices.filter(p => 
      p.licensePlate.toLowerCase() === licensePlate.toLowerCase() &&
      new Date(p.date).toDateString() === targetDate &&
      p.id !== excludeId
    );
    
    // Check appointments
    const appointments = getAppointments(userId);
    const targetDateAppointments = appointments.filter(a => 
      a.licensePlate.toLowerCase() === licensePlate.toLowerCase() &&
      new Date(a.appointmentDate).toDateString() === targetDate &&
      a.status !== 'cancelled' &&
      a.id !== excludeId
    );
    
    return targetDateTransactions.length === 0 && targetDatePending.length === 0 && targetDateAppointments.length === 0;
  } catch (error) {
    console.error('Error checking license plate availability:', error);
    return true;
  }
};

export const getLicensePlateConflictMessage = (licensePlate: string, userId: string, checkDate?: string): string => {
  try {
    // Use provided date or default to today
    const targetDate = checkDate ? new Date(checkDate).toDateString() : new Date().toDateString();
    const dateLabel = checkDate ? checkDate : 'өнөөдөр';
    
    // Check what type of conflict exists
    const transactions = getTransactions(userId);
    const targetDateTransactions = transactions.filter(t => 
      t.licensePlate.toLowerCase() === licensePlate.toLowerCase() &&
      new Date(t.date).toDateString() === targetDate
    );
    
    if (targetDateTransactions.length > 0) {
      return `${licensePlate} дугаартай машин ${dateLabel} аль хэдийн гүйлгээ хийсэн байна.`;
    }
    
    const pendingServices = getPendingServices(userId);
    const targetDatePending = pendingServices.filter(p => 
      p.licensePlate.toLowerCase() === licensePlate.toLowerCase() &&
      new Date(p.date).toDateString() === targetDate
    );
    
    if (targetDatePending.length > 0) {
      return `${licensePlate} дугаартай машин ${dateLabel} хүлээгдэж буй үйлчилгээтэй байна.`;
    }
    
    const appointments = getAppointments(userId);
    const targetDateAppointments = appointments.filter(a => 
      a.licensePlate.toLowerCase() === licensePlate.toLowerCase() &&
      new Date(a.appointmentDate).toDateString() === targetDate &&
      a.status !== 'cancelled'
    );
    
    if (targetDateAppointments.length > 0) {
      return `${licensePlate} дугаартай машин ${dateLabel} цаг захиалгатай байна.`;
    }
    
    return '';
  } catch (error) {
    console.error('Error getting license plate conflict message:', error);
    return '';
  }
};

// Appointment reminder functions
export const getActiveReminders = (userId: string): AppointmentReminder[] => {
  try {
    const remindersStr = localStorage.getItem(STORAGE_KEYS.APPOINTMENT_REMINDERS);
    const reminders: AppointmentReminder[] = remindersStr ? JSON.parse(remindersStr) : [];
    
    return reminders.filter(r => r.userId === userId && !r.isRead);
  } catch (error) {
    console.error('Error getting active reminders:', error);
    return [];
  }
};

export const markReminderAsRead = (reminderId: string): boolean => {
  try {
    const remindersStr = localStorage.getItem(STORAGE_KEYS.APPOINTMENT_REMINDERS);
    const reminders: AppointmentReminder[] = remindersStr ? JSON.parse(remindersStr) : [];
    
    const reminderIndex = reminders.findIndex(r => r.id === reminderId);
    if (reminderIndex >= 0) {
      reminders[reminderIndex].isRead = true;
      localStorage.setItem(STORAGE_KEYS.APPOINTMENT_REMINDERS, JSON.stringify(reminders));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error marking reminder as read:', error);
    return false;
  }
};

export const deleteRemindersByAppointmentId = (appointmentId: string): boolean => {
  try {
    const remindersStr = localStorage.getItem(STORAGE_KEYS.APPOINTMENT_REMINDERS);
    const reminders: AppointmentReminder[] = remindersStr ? JSON.parse(remindersStr) : [];
    
    const filteredReminders = reminders.filter(r => r.appointmentId !== appointmentId);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENT_REMINDERS, JSON.stringify(filteredReminders));
    
    return true;
  } catch (error) {
    console.error('Error deleting reminders by appointment ID:', error);
    return false;
  }
};

export const createAppointmentReminder = (appointment: Appointment): boolean => {
  try {
    const reminder: AppointmentReminder = {
      id: Date.now().toString(),
      appointmentId: appointment.id,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      licensePlate: appointment.licensePlate,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      reminderTime: new Date(appointment.appointmentDate.getTime() - 60 * 60 * 1000), // 1 hour before
      isRead: false,
      createdAt: new Date(),
      userId: appointment.userId
    };
    
    const remindersStr = localStorage.getItem(STORAGE_KEYS.APPOINTMENT_REMINDERS);
    const reminders: AppointmentReminder[] = remindersStr ? JSON.parse(remindersStr) : [];
    
    reminders.push(reminder);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENT_REMINDERS, JSON.stringify(reminders));
    
    return true;
  } catch (error) {
    console.error('Error creating appointment reminder:', error);
    return false;
  }
};

// Notification functions
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const showAppointmentNotification = (appointment: Appointment): void => {
  try {
    if (Notification.permission === 'granted') {
      new Notification(`Appointment Reminder`, {
        body: `${appointment.customerName} - ${appointment.licensePlate} at ${appointment.appointmentTime}`,
        icon: '/favicon.ico'
      });
    }
  } catch (error) {
    console.error('Error showing appointment notification:', error);
  }
};

// Enhanced employee salary report export function
export const exportEmployeeSalaryReport = (
  employee: Employee, 
  transactions: Transaction[], 
  timeRangeLabel: string, 
  user: User
): void => {
  try {
    // Filter transactions where this employee has commissions
    const employeeTransactions = transactions.filter(transaction => 
      transaction.commissions && transaction.commissions.some(commission => commission.employeeId === employee.id)
    );

    // Calculate employee salary data with enhanced details
    let totalEarnings = 0;
    let totalServices = 0;
    let totalTransactions = employeeTransactions.length;
    let totalRevenue = 0;
    let paidTransactionsCount = 0;
    let unpaidTransactionsCount = 0;

    // Create detailed transaction data
    const employeeData = employeeTransactions.map((transaction, index) => {
      // Find the commission for this employee in this transaction
      const employeeCommission = transaction.commissions.find(commission => commission.employeeId === employee.id);
      const commissionAmount = employeeCommission ? employeeCommission.amount : 0;
      
      // Use the stored commission rate from the transaction, fallback to employee's current rate
      const usedCommissionRate = employeeCommission?.commissionRate || employee.defaultCommissionRate;
      
      totalEarnings += commissionAmount;
      totalServices += transaction.services?.length || 0;
      
      // Track paid/unpaid status
      if (employeeCommission?.isPaid) {
        paidTransactionsCount++;
      } else {
        unpaidTransactionsCount++;
      }
      
      // Calculate this employee's share of the transaction revenue
      const employeeCount = transaction.employees?.length || 1;
      const employeeRevenueShare = transaction.totalAmount / employeeCount;
      totalRevenue += employeeRevenueShare;

      // Get payment method in Mongolian
      const getPaymentMethodMongolian = (method: string) => {
        switch (method) {
          case 'cash': return 'Бэлэн мөнгө';
          case 'card': return 'Карт';
          case 'transfer': return 'Шилжүүлэг';
          default: return method;
        }
      };

      // Get commission paid status in Mongolian
      const getCommissionPaidStatus = (isPaid?: boolean) => {
        return isPaid ? 'Төлөгдсөн' : 'Төлөгдөөгүй';
      };

      return {
        'Д/д': index + 1,
        'Огноо': new Date(transaction.date).toLocaleDateString('mn-MN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        'Машины дугаар': transaction.licensePlate,
        'Үйлчилгээ': transaction.services?.map(s => s.serviceName).join(', ') || '',
        'Гүйлгээний дүн': `₮${transaction.totalAmount.toLocaleString()}`,
        'Ажилтны тоо': employeeCount,
        'Орлогын хувь': `₮${employeeRevenueShare.toLocaleString()}`,
        'Цалингийн хувь': `${usedCommissionRate}%`,
        'Олсон цалин': `₮${commissionAmount.toLocaleString()}`,
        'Цалин төлөгдсөн эсэх': getCommissionPaidStatus(employeeCommission?.isPaid),
        'Төлбөрийн хэлбэр': getPaymentMethodMongolian(transaction.paymentMethod),
        'Тэмдэглэл': transaction.notes || '',
        'Цалингийн тэмдэглэл': employeeCommission?.notes || ''
      };
    });

    // Add separator and summary section
    if (employeeData.length > 0) {
      // Add separator row
      employeeData.push({
        'Д/д': '═══',
        'Огноо': '═══════════════════',
        'Машины дугаар': '═══════════',
        'Үйлчилгээ': '═══════════════════════════════',
        'Гүйлгээний дүн': '═══════════════',
        'Ажилтны тоо': '═══',
        'Орлогын хувь': '═══════════════',
        'Цалингийн хувь': '═══════',
        'Олсон цалин': '═══════════════',
        'Цалин төлөгдсөн эсэх': '═══════════════',
        'Төлбөрийн хэлбэр': '═══════════',
        'Тэмдэглэл': '═══════════',
        'Цалингийн тэмдэглэл': '═══════════════'
      });

      // Add summary rows
      employeeData.push({
        'Д/д': '',
        'Огноо': 'НИЙТ ДҮГНЭЛТ',
        'Машины дугаар': '',
        'Үйлчилгээ': `${totalServices} үйлчилгээ`,
        'Гүйлгээний дүн': `₮${totalRevenue.toLocaleString()}`,
        'Ажилтны тоо': '',
        'Орлогын хувь': `${totalTransactions} гүйлгээ`,
        'Цалингийн хувь': `Одоогийн: ${employee.defaultCommissionRate}%`,
        'Олсон цалин': `₮${totalEarnings.toLocaleString()}`,
        'Цалин төлөгдсөн эсэх': `Төлөгдсөн: ${paidTransactionsCount}, Төлөгдөөгүй: ${unpaidTransactionsCount}`,
        'Төлбөрийн хэлбэр': '',
        'Тэмдэглэл': '',
        'Цалингийн тэмдэглэл': ''
      });
    }

    // If no data, create a placeholder with employee info
    if (employeeData.length === 0) {
      employeeData.push({
        'Д/д': '1',
        'Огноо': 'Мэдээлэл байхгүй',
        'Машины дугаар': '',
        'Үйлчилгээ': '',
        'Гүйлгээний дүн': '₮0',
        'Ажилтны тоо': '',
        'Орлогын хувь': '₮0',
        'Цалингийн хувь': `${employee.defaultCommissionRate}%`,
        'Олсон цалин': '₮0',
        'Цалин төлөгдсөн эсэх': 'Төлөгдөөгүй',
        'Төлбөрийн хэлбэр': '',
        'Тэмдэглэл': 'Тухайн хугацаанд гүйлгээ байхгүй',
        'Цалингийн тэмдэглэл': ''
      });
    }

    // Create enhanced filename with employee name and date range
    const filename = `${employee.name.replace(/\s+/g, '_')}_цалингийн_тайлан_${timeRangeLabel}`;
    
    // Create CSV content with proper formatting
    const headers = Object.keys(employeeData[0] || {});
    const csvContent = [
      // Add header with employee info and report details
      `"АЖИЛТНЫ ЦАЛИНГИЙН ДЭЛГЭРЭНГҮЙ ТАЙЛАН"`,
      `"═══════════════════════════════════════════════════════════════"`,
      `"Ажилтны нэр: ${employee.name}"`,
      `"Утасны дугаар: ${employee.phone}"`,
      `"Одоогийн цалингийн хувь: ${employee.defaultCommissionRate}%"`,
      `"Тайлангийн хугацаа: ${timeRangeLabel}"`,
      `"Үүсгэсэн огноо: ${new Date().toLocaleString('mn-MN')}"`,
      `"Бизнес: ${user.businessName}"`,
      `"Төлөгдсөн гүйлгээ: ${paidTransactionsCount}, Төлөгдөөгүй гүйлгээ: ${unpaidTransactionsCount}"`,
      `"АНХААР: Цалингийн хувь нь гүйлгээ хийх үеийн хувь харагдана"`,
      `"═══════════════════════════════════════════════════════════════"`,
      `""`, // Empty line
      // Add column headers
      headers.map(h => `"${h}"`).join(','),
      // Add data rows
      ...employeeData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    // Create and download file with UTF-8 BOM for proper Excel encoding
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting employee salary report:', error);
  }
};

export const shareToMessenger = async (message: string): Promise<boolean> => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Car Wash Report',
        text: message
      });
      return true;
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(message);
      alert('Тайлан clipboard-д хуулагдлаа!');
      return true;
    }
  } catch (error) {
    console.error('Error sharing to messenger:', error);
    try {
      // Final fallback: copy to clipboard
      await navigator.clipboard.writeText(message);
      alert('Тайлан clipboard-д хуулагдлаа!');
      return true;
    } catch (clipboardError) {
      console.error('Error copying to clipboard:', clipboardError);
      alert('Тайлан хуваалцах эсвэл хуулахад алдаа гарлаа');
      return false;
    }
  }
};

export const generateReportSummary = (data: any): string => {
  try {
    const summary = `Car Wash Report Summary:
Total Revenue: ₮${data.totalRevenue?.toLocaleString() || 0}
Total Transactions: ${data.totalTransactions || 0}
Total Services: ${data.totalServices || 0}
Total Commissions: ₮${data.totalCommissions?.toLocaleString() || 0}
Generated: ${new Date().toLocaleString()}`;
    
    return summary;
  } catch (error) {
    console.error('Error generating report summary:', error);
    return 'Error generating report summary';
  }
};

// Export all reports combined into a single CSV file
export const exportAllReportsToSingleCSV = (
  dailyData: any[], 
  employeeData: any[], 
  serviceData: any[], 
  filename: string,
  dateRange: { from: string; to: string }
): void => {
  try {
    let csvContent = '';
    
    // Add UTF-8 BOM for proper Excel encoding of Mongolian characters
    const BOM = '\uFEFF';
    
    // Add header with date range and timestamp
    csvContent += `"CARWASH MANAGER - НЭГТГЭСЭН ТАЙЛАН"\n`;
    csvContent += `"Хугацаа: ${dateRange.from} - ${dateRange.to}"\n`;
    csvContent += `"Үүсгэсэн огноо: ${new Date().toLocaleString('mn-MN')}"\n`;
    csvContent += `"═══════════════════════════════════════════════════════════════"\n\n`;
    
    // Daily Report Section
    if (dailyData.length > 0) {
      csvContent += '"┌─────────────────────────────────────────────────────────────┐"\n';
      csvContent += '"│                    ӨДРИЙН ТАЙЛАН                           │"\n';
      csvContent += '"└─────────────────────────────────────────────────────────────┘"\n\n';
      
      const dailyHeaders = Object.keys(dailyData[0]);
      csvContent += dailyHeaders.map(h => `"${h}"`).join(',') + '\n';
      
      dailyData.forEach(row => {
        csvContent += dailyHeaders.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',') + '\n';
      });
      
      // Add summary for daily report
      const totals = dailyData.reduce((acc, day) => ({
        revenue: acc.revenue + (day['Нийт орлого'] || 0),
        transactions: acc.transactions + (day['Нийт гүйлгээ'] || 0),
        services: acc.services + (day['Үйлчилгээний тоо'] || 0),
        commissions: acc.commissions + (day['Нийт цалин'] || 0)
      }), { revenue: 0, transactions: 0, services: 0, commissions: 0 });
      
      csvContent += '\n"─────────────────────────────────────────────────────────────"\n';
      csvContent += '"ӨДРИЙН ТАЙЛАНГИЙН НИЙТ ДҮГНЭЛТ"\n';
      csvContent += '"─────────────────────────────────────────────────────────────"\n';
      csvContent += `"Нийт орлого","₮${totals.revenue.toLocaleString()}"\n`;
      csvContent += `"Нийт гүйлгээ","${totals.transactions}"\n`;
      csvContent += `"Нийт үйлчилгээ","${totals.services}"\n`;
      csvContent += `"Нийт цалин","₮${totals.commissions.toLocaleString()}"\n`;
      csvContent += '"═══════════════════════════════════════════════════════════════"\n\n\n';
    }
    
    // Employee Report Section
    if (employeeData.length > 0) {
      csvContent += '"┌─────────────────────────────────────────────────────────────┐"\n';
      csvContent += '"│                   АЖИЛТНЫ ТАЙЛАН                          │"\n';
      csvContent += '"└─────────────────────────────────────────────────────────────┘"\n\n';
      
      const employeeHeaders = Object.keys(employeeData[0]);
      csvContent += employeeHeaders.map(h => `"${h}"`).join(',') + '\n';
      
      employeeData.forEach(row => {
        csvContent += employeeHeaders.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',') + '\n';
      });
      
      // Add summary for employee report
      const totalEarnings = employeeData.reduce((sum, emp) => sum + (emp['Нийт цалин'] || 0), 0);
      const totalServices = employeeData.reduce((sum, emp) => sum + (emp['Үйлчилгээний тоо'] || 0), 0);
      const totalTransactions = employeeData.reduce((sum, emp) => sum + (emp['Гүйлгээний тоо'] || 0), 0);
      
      csvContent += '\n"─────────────────────────────────────────────────────────────"\n';
      csvContent += '"АЖИЛТНЫ ТАЙЛАНГИЙН НИЙТ ДҮГНЭЛТ"\n';
      csvContent += '"─────────────────────────────────────────────────────────────"\n';
      csvContent += `"Ажилтны тоо","${employeeData.length}"\n`;
      csvContent += `"Нийт цалин","₮${totalEarnings.toLocaleString()}"\n`;
      csvContent += `"Нийт үйлчилгээ","${totalServices}"\n`;
      csvContent += `"Нийт гүйлгээ","${totalTransactions}"\n`;
      csvContent += '"═══════════════════════════════════════════════════════════════"\n\n\n';
    }
    
    // Service Report Section
    if (serviceData.length > 0) {
      csvContent += '"┌─────────────────────────────────────────────────────────────┐"\n';
      csvContent += '"│                 ҮЙЛЧИЛГЭЭНИЙ ТАЙЛАН                       │"\n';
      csvContent += '"└─────────────────────────────────────────────────────────────┘"\n\n';
      
      const serviceHeaders = Object.keys(serviceData[0]);
      csvContent += serviceHeaders.map(h => `"${h}"`).join(',') + '\n';
      
      serviceData.forEach(row => {
        csvContent += serviceHeaders.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',') + '\n';
      });
      
      // Add summary for service report
      const totalRevenue = serviceData.reduce((sum, service) => sum + (service['Нийт орлого'] || 0), 0);
      const totalCount = serviceData.reduce((sum, service) => sum + (service['Хийгдсэн тоо'] || 0), 0);
      const totalCommissions = serviceData.reduce((sum, service) => sum + (service['Нийт цалин'] || 0), 0);
      
      csvContent += '\n"─────────────────────────────────────────────────────────────"\n';
      csvContent += '"ҮЙЛЧИЛГЭЭНИЙ ТАЙЛАНГИЙН НИЙТ ДҮГНЭЛТ"\n';
      csvContent += '"─────────────────────────────────────────────────────────────"\n';
      csvContent += `"Үйлчилгээний төрөл","${serviceData.length}"\n`;
      csvContent += `"Нийт орлого","₮${totalRevenue.toLocaleString()}"\n`;
      csvContent += `"Нийт тоо хэмжээ","${totalCount}"\n`;
      csvContent += `"Нийт цалин","₮${totalCommissions.toLocaleString()}"\n`;
      csvContent += '"═══════════════════════════════════════════════════════════════"\n\n';
    }
    
    // Add footer with generation info
    csvContent += '"─────────────────────────────────────────────────────────────"\n';
    csvContent += '"ТАЙЛАНГИЙН ДУУСГАЛ"\n';
    csvContent += `"Нийт хуудас: 1 | Үүсгэсэн: ${new Date().toLocaleString('mn-MN')}"\n`;
    csvContent += '"CARWASH MANAGER © 2025"\n';
    csvContent += '"═══════════════════════════════════════════════════════════════"\n';
    
    // Create and download the file
    const csvWithBOM = BOM + csvContent;
    const blob = new Blob([csvWithBOM], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting combined reports to CSV:', error);
  }
};