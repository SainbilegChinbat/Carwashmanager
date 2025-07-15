import { supabase } from '../utils/supabaseClient';
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
import { format } from 'date-fns';

// User services
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !userData) {
      console.error('Error getting user data:', userError);
      return null;
    }
    
    return {
      id: userData.id,
      email: userData.email,
      businessName: userData.business_name,
      phone: userData.phone || '',
      address: userData.address || ''
    };
  } catch (error) {
    console.error('Exception getting current user:', error);
    return null;
  }
};

export const updateUserProfile = async (userData: User): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        business_name: userData.businessName,
        phone: userData.phone || null,
        address: userData.address || null
      })
      .eq('id', userData.id);
    
    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception updating user profile:', error);
    return false;
  }
};

// Service services
export const getServices = async (userId: string): Promise<Service[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    
    if (error) {
      console.error('Error getting services:', error);
      return [];
    }
    
    return data.map(service => ({
      id: service.id,
      name: service.name,
      price: service.price,
      commissionRate: service.commission_rate,
      userId: service.user_id,
      category: service.category || 'Ерөнхий'
    }));
  } catch (error) {
    console.error('Exception getting services:', error);
    return [];
  }
};

export const saveService = async (service: Service): Promise<boolean> => {
  try {
    console.log('supabaseService: saveService called with:', service);
    const serviceData = {
      id: service.id,
      user_id: service.userId,
      name: service.name,
      price: service.price,
      commission_rate: service.commissionRate,
      category: service.category || 'Ерөнхий'
    };
    
    // Check if service exists
    const { data: existingService } = await supabase
      .from('services')
      .select('id')
      .eq('id', service.id)
      .maybeSingle();
    console.log('supabaseService: existingService check result:', existingService);
    
    let result;
    
    if (existingService) {
      // Update existing service
      result = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', service.id);
    } else {
      // Insert new service
      result = await supabase
        .from('services')
        .insert(serviceData);
    }
    console.log('supabaseService: result of insert/update:', result);
    
    if (result.error) {
      console.error('Error saving service:', result.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception saving service:', error);
    return false;
  }
};

export const deleteService = async (serviceId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);
    
    if (error) {
      console.error('Error deleting service:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting service:', error);
    return false;
  }
};

// Category management functions
export const updateServiceCategory = async (oldCategory: string, newCategory: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('services')
      .update({ category: newCategory })
      .eq('user_id', userId)
      .eq('category', oldCategory);
    
    if (error) {
      console.error('Error updating service category:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception updating service category:', error);
    return false;
  }
};

export const deleteServiceCategory = async (categoryToDelete: string, newCategoryForServices: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('services')
      .update({ category: newCategoryForServices })
      .eq('user_id', userId)
      .eq('category', categoryToDelete);
    
    if (error) {
      console.error('Error deleting service category:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting service category:', error);
    return false;
  }
};

export const getServiceCategories = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('category')
      .eq('user_id', userId)
      .order('category');
    
    if (error) {
      console.error('Error getting service categories:', error);
      return ['Ерөнхий'];
    }
    
    // Use a Set to ensure unique categories
    const categories = new Set<string>();
    
    // Always include 'Ерөнхий' as the default category
    categories.add('Ерөнхий');
    
    // Add all non-null categories from the data
    data.forEach(item => {
      if (item.category) {
        categories.add(item.category);
      }
    });
    
    // Convert to array and sort
    return Array.from(categories).sort((a, b) => {
      if (a === 'Ерөнхий') return -1;
      if (b === 'Ерөнхий') return 1;
      return a.localeCompare(b);
    });
  } catch (error) {
    console.error('Exception getting service categories:', error);
    return ['Ерөнхий'];
  }
};

// Employee services
export const getEmployees = async (userId: string): Promise<Employee[]> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    
    if (error) {
      console.error('Error getting employees:', error);
      return [];
    }
    
    return data.map(employee => ({
      id: employee.id,
      name: employee.name,
      phone: employee.phone,
      address: employee.address,
      defaultCommissionRate: employee.default_commission_rate,
      userId: employee.user_id
    }));
  } catch (error) {
    console.error('Exception getting employees:', error);
    return [];
  }
};

export const saveEmployee = async (employee: Employee): Promise<boolean> => {
  try {
    const employeeData = {
      id: employee.id,
      user_id: employee.userId,
      name: employee.name,
      phone: employee.phone,
      address: employee.address,
      default_commission_rate: employee.defaultCommissionRate
    };
    
    // Check if employee exists
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('id', employee.id)
      .maybeSingle();
    
    let result;
    
    if (existingEmployee) {
      // Update existing employee
      result = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', employee.id);
    } else {
      // Insert new employee
      result = await supabase
        .from('employees')
        .insert(employeeData);
    }
    
    if (result.error) {
      console.error('Error saving employee:', result.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception saving employee:', error);
    return false;
  }
};

export const deleteEmployee = async (employeeId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);
    
    if (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting employee:', error);
    return false;
  }
};

// Transaction services
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transaction_details_view')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
    
    return data.map(transaction => ({
      id: transaction.id,
      licensePlate: transaction.license_plate,
      services: transaction.services || [],
      employees: transaction.employees || [],
      paymentMethod: transaction.payment_method as 'cash' | 'transfer' | 'card',
      totalAmount: transaction.total_amount,
      commissions: transaction.commissions || [],
      date: new Date(transaction.date),
      userId: transaction.user_id,
      status: transaction.status as 'completed' | 'pending',
      notes: transaction.notes || ''
    }));
  } catch (error) {
    console.error('Exception getting transactions:', error);
    return [];
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<boolean> => {
  try {
    // Start a transaction
    const { error: transactionError } = await supabase.rpc('begin_transaction');
    if (transactionError) {
      console.error('Error starting transaction:', transactionError);
      return false;
    }
    
    try {
      // 1. Insert/update the transaction
      const transactionData = {
        id: transaction.id,
        user_id: transaction.userId,
        license_plate: transaction.licensePlate,
        payment_method: transaction.paymentMethod,
        total_amount: transaction.totalAmount,
        status: transaction.status,
        notes: transaction.notes || null,
        date: transaction.date.toISOString()
      };
      
      // Check if transaction exists
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('id', transaction.id)
        .maybeSingle();
      
      let transactionResult;
      
      if (existingTransaction) {
        // Update existing transaction
        transactionResult = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction.id);
      } else {
        // Insert new transaction
        transactionResult = await supabase
          .from('transactions')
          .insert(transactionData);
      }
      
      if (transactionResult.error) {
        throw new Error(`Error saving transaction: ${transactionResult.error.message}`);
      }
      
      // 2. If updating, delete existing related records
      if (existingTransaction) {
        // Delete existing services
        const { error: deleteServicesError } = await supabase
          .from('transaction_services')
          .delete()
          .eq('transaction_id', transaction.id);
        
        if (deleteServicesError) {
          throw new Error(`Error deleting transaction services: ${deleteServicesError.message}`);
        }
        
        // Delete existing employees
        const { error: deleteEmployeesError } = await supabase
          .from('transaction_employees')
          .delete()
          .eq('transaction_id', transaction.id);
        
        if (deleteEmployeesError) {
          throw new Error(`Error deleting transaction employees: ${deleteEmployeesError.message}`);
        }
        
        // Delete existing commissions
        const { error: deleteCommissionsError } = await supabase
          .from('commissions')
          .delete()
          .eq('transaction_id', transaction.id);
        
        if (deleteCommissionsError) {
          throw new Error(`Error deleting commissions: ${deleteCommissionsError.message}`);
        }
      }
      
      // 3. Insert services
      if (transaction.services.length > 0) {
        const serviceData = transaction.services.map(service => ({
          transaction_id: transaction.id,
          service_id: service.serviceId,
          service_name: service.serviceName,
          price: service.price,
          commission_rate: service.commissionRate
        }));
        
        const { error: insertServicesError } = await supabase
          .from('transaction_services')
          .insert(serviceData);
        
        if (insertServicesError) {
          throw new Error(`Error inserting transaction services: ${insertServicesError.message}`);
        }
      }
      
      // 4. Insert employees
      if (transaction.employees.length > 0) {
        const employeeData = transaction.employees.map(employeeId => ({
          transaction_id: transaction.id,
          employee_id: employeeId
        }));
        
        const { error: insertEmployeesError } = await supabase
          .from('transaction_employees')
          .insert(employeeData);
        
        if (insertEmployeesError) {
          throw new Error(`Error inserting transaction employees: ${insertEmployeesError.message}`);
        }
      }
      
      // 5. Insert commissions
      if (transaction.commissions.length > 0) {
        const commissionData = transaction.commissions.map(commission => ({
          transaction_id: transaction.id,
          employee_id: commission.employeeId,
          employee_name: commission.employeeName,
          service_id: commission.serviceId,
          amount: commission.amount,
          commission_rate: commission.commissionRate,
          is_paid: commission.isPaid || false,
          notes: commission.notes || null
        }));
        
        const { error: insertCommissionsError } = await supabase
          .from('commissions')
          .insert(commissionData);
        
        if (insertCommissionsError) {
          throw new Error(`Error inserting commissions: ${insertCommissionsError.message}`);
        }
      }
      
      // Commit the transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) {
        throw new Error(`Error committing transaction: ${commitError.message}`);
      }
      
      return true;
    } catch (error) {
      // Rollback the transaction on error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    console.error('Exception saving transaction:', error);
    return false;
  }
};

export const deleteTransaction = async (transactionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);
    
    if (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting transaction:', error);
    return false;
  }
};

export const markEmployeeCommissionAsPaid = async (
  employeeId: string, 
  transactionIds: string[], 
  notes: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('commissions')
      .update({
        is_paid: true,
        notes: notes
      })
      .eq('employee_id', employeeId)
      .in('transaction_id', transactionIds);
    
    if (error) {
      console.error('Error marking commissions as paid:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception marking commissions as paid:', error);
    return false;
  }
};

// Pending service services
export const getPendingServices = async (userId: string): Promise<PendingService[]> => {
  try {
    const { data, error } = await supabase
      .from('pending_service_details_view')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error getting pending services:', error);
      return [];
    }
    
    return data.map(pendingService => ({
      id: pendingService.id,
      licensePlate: pendingService.license_plate,
      services: pendingService.services || [],
      employees: pendingService.employees || [],
      totalAmount: pendingService.total_amount,
      commissions: pendingService.commissions || [],
      date: new Date(pendingService.date),
      userId: pendingService.user_id,
      estimatedCompletion: pendingService.estimated_completion ? new Date(pendingService.estimated_completion) : undefined,
      notes: pendingService.notes || ''
    }));
  } catch (error) {
    console.error('Exception getting pending services:', error);
    return [];
  }
};

export const savePendingService = async (pendingService: PendingService): Promise<boolean> => {
  try {
    // Start a transaction
    const { error: transactionError } = await supabase.rpc('begin_transaction');
    if (transactionError) {
      console.error('Error starting transaction:', transactionError);
      return false;
    }
    
    try {
      // 1. Insert/update the pending service
      const pendingServiceData = {
        id: pendingService.id,
        user_id: pendingService.userId,
        license_plate: pendingService.licensePlate,
        total_amount: pendingService.totalAmount,
        notes: pendingService.notes || null,
        date: pendingService.date.toISOString(),
        estimated_completion: pendingService.estimatedCompletion?.toISOString() || null
      };
      
      // Check if pending service exists
      const { data: existingPendingService } = await supabase
        .from('pending_services')
        .select('id')
        .eq('id', pendingService.id)
        .maybeSingle();
      
      let pendingServiceResult;
      
      if (existingPendingService) {
        // Update existing pending service
        pendingServiceResult = await supabase
          .from('pending_services')
          .update(pendingServiceData)
          .eq('id', pendingService.id);
      } else {
        // Insert new pending service
        pendingServiceResult = await supabase
          .from('pending_services')
          .insert(pendingServiceData);
      }
      
      if (pendingServiceResult.error) {
        throw new Error(`Error saving pending service: ${pendingServiceResult.error.message}`);
      }
      
      // 2. If updating, delete existing related records
      if (existingPendingService) {
        // Delete existing services
        const { error: deleteServicesError } = await supabase
          .from('pending_service_details')
          .delete()
          .eq('pending_service_id', pendingService.id);
        
        if (deleteServicesError) {
          throw new Error(`Error deleting pending service details: ${deleteServicesError.message}`);
        }
        
        // Delete existing employees
        const { error: deleteEmployeesError } = await supabase
          .from('pending_service_employees')
          .delete()
          .eq('pending_service_id', pendingService.id);
        
        if (deleteEmployeesError) {
          throw new Error(`Error deleting pending service employees: ${deleteEmployeesError.message}`);
        }
        
        // Delete existing commissions
        const { error: deleteCommissionsError } = await supabase
          .from('pending_service_commissions')
          .delete()
          .eq('pending_service_id', pendingService.id);
        
        if (deleteCommissionsError) {
          throw new Error(`Error deleting pending service commissions: ${deleteCommissionsError.message}`);
        }
      }
      
      // 3. Insert services
      if (pendingService.services.length > 0) {
        const serviceData = pendingService.services.map(service => ({
          pending_service_id: pendingService.id,
          service_id: service.serviceId,
          service_name: service.serviceName,
          price: service.price,
          commission_rate: service.commissionRate
        }));
        
        const { error: insertServicesError } = await supabase
          .from('pending_service_details')
          .insert(serviceData);
        
        if (insertServicesError) {
          throw new Error(`Error inserting pending service details: ${insertServicesError.message}`);
        }
      }
      
      // 4. Insert employees
      if (pendingService.employees.length > 0) {
        const employeeData = pendingService.employees.map(employeeId => ({
          pending_service_id: pendingService.id,
          employee_id: employeeId
        }));
        
        const { error: insertEmployeesError } = await supabase
          .from('pending_service_employees')
          .insert(employeeData);
        
        if (insertEmployeesError) {
          throw new Error(`Error inserting pending service employees: ${insertEmployeesError.message}`);
        }
      }
      
      // 5. Insert commissions
      if (pendingService.commissions.length > 0) {
        const commissionData = pendingService.commissions.map(commission => ({
          pending_service_id: pendingService.id,
          employee_id: commission.employeeId,
          employee_name: commission.employeeName,
          service_id: commission.serviceId,
          amount: commission.amount,
          commission_rate: commission.commissionRate
        }));
        
        const { error: insertCommissionsError } = await supabase
          .from('pending_service_commissions')
          .insert(commissionData);
        
        if (insertCommissionsError) {
          throw new Error(`Error inserting pending service commissions: ${insertCommissionsError.message}`);
        }
      }
      
      // Commit the transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) {
        throw new Error(`Error committing transaction: ${commitError.message}`);
      }
      
      return true;
    } catch (error) {
      // Rollback the transaction on error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    console.error('Exception saving pending service:', error);
    return false;
  }
};

export const deletePendingService = async (pendingServiceId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pending_services')
      .delete()
      .eq('id', pendingServiceId);
    
    if (error) {
      console.error('Error deleting pending service:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting pending service:', error);
    return false;
  }
};

export const completePendingService = async (
  pendingServiceId: string, 
  paymentMethod: 'cash' | 'transfer' | 'card'
): Promise<boolean> => {
  try {
    // Get the pending service
    const { data: pendingService, error: fetchError } = await supabase
      .from('pending_service_details_view')
      .select('*')
      .eq('id', pendingServiceId)
      .single();
    
    if (fetchError || !pendingService) {
      console.error('Error fetching pending service:', fetchError);
      return false;
    }
    
    // Create a new transaction
    const transactionId = crypto.randomUUID();
    const transactionData = {
      id: transactionId,
      user_id: pendingService.user_id,
      license_plate: pendingService.license_plate,
      payment_method: paymentMethod,
      total_amount: pendingService.total_amount,
      status: 'completed',
      notes: pendingService.notes,
      date: new Date().toISOString()
    };
    
    const { error: insertTransactionError } = await supabase
      .from('transactions')
      .insert(transactionData);
    
    if (insertTransactionError) {
      console.error('Error inserting transaction:', insertTransactionError);
      return false;
    }
    
    // Insert services
    if (pendingService.services && pendingService.services.length > 0) {
      const serviceData = pendingService.services.map((service: any) => ({
        transaction_id: transactionId,
        service_id: service.serviceId,
        service_name: service.serviceName,
        price: service.price,
        commission_rate: service.commissionRate
      }));
      
      const { error: insertServicesError } = await supabase
        .from('transaction_services')
        .insert(serviceData);
      
      if (insertServicesError) {
        console.error('Error inserting transaction services:', insertServicesError);
        return false;
      }
    }
    
    // Insert employees
    if (pendingService.employees && pendingService.employees.length > 0) {
      const employeeData = pendingService.employees.map((employeeId: string) => ({
        transaction_id: transactionId,
        employee_id: employeeId
      }));
      
      const { error: insertEmployeesError } = await supabase
        .from('transaction_employees')
        .insert(employeeData);
      
      if (insertEmployeesError) {
        console.error('Error inserting transaction employees:', insertEmployeesError);
        return false;
      }
    }
    
    // Insert commissions
    if (pendingService.commissions && pendingService.commissions.length > 0) {
      const commissionData = pendingService.commissions.map((commission: any) => ({
        transaction_id: transactionId,
        employee_id: commission.employeeId,
        employee_name: commission.employeeName,
        service_id: commission.serviceId,
        amount: commission.amount,
        commission_rate: commission.commissionRate,
        is_paid: false,
        notes: ''
      }));
      
      const { error: insertCommissionsError } = await supabase
        .from('commissions')
        .insert(commissionData);
      
      if (insertCommissionsError) {
        console.error('Error inserting commissions:', insertCommissionsError);
        return false;
      }
    }
    
    // Delete the pending service
    const { error: deleteError } = await supabase
      .from('pending_services')
      .delete()
      .eq('id', pendingServiceId);
    
    if (deleteError) {
      console.error('Error deleting pending service:', deleteError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception completing pending service:', error);
    return false;
  }
};

// Appointment services
export const getAppointments = async (userId: string): Promise<Appointment[]> => {
  try {
    const { data, error } = await supabase
      .from('appointment_details_view')
      .select('*')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: false });
    
    if (error) {
      console.error('Error getting appointments:', error);
      return [];
    }
    
    return data.map(appointment => ({
      id: appointment.id,
      licensePlate: appointment.license_plate,
      customerName: appointment.customer_name,
      customerPhone: appointment.customer_phone,
      services: appointment.services || [],
      employees: appointment.employees || [],
      totalAmount: appointment.total_amount,
      commissions: appointment.commissions || [],
      appointmentDate: new Date(appointment.appointment_date),
      appointmentTime: appointment.appointment_time,
      userId: appointment.user_id,
      status: appointment.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled',
      notes: appointment.notes || '',
      createdAt: new Date(appointment.created_at)
    }));
  } catch (error) {
    console.error('Exception getting appointments:', error);
    return [];
  }
};

export const saveAppointment = async (appointment: Appointment): Promise<boolean> => {
  try {
    // Start a transaction
    const { error: transactionError } = await supabase.rpc('begin_transaction');
    if (transactionError) {
      console.error('Error starting transaction:', transactionError);
      return false;
    }
    
    try {
      // 1. Insert/update the appointment
      const appointmentData = {
        id: appointment.id,
        user_id: appointment.userId,
        license_plate: appointment.licensePlate,
        customer_name: appointment.customerName,
        customer_phone: appointment.customerPhone,
        appointment_date: appointment.appointmentDate.toISOString(),
        appointment_time: appointment.appointmentTime,
        total_amount: appointment.totalAmount,
        status: appointment.status,
        notes: appointment.notes || null
      };
      
      // Check if appointment exists
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', appointment.id)
        .maybeSingle();
      
      let appointmentResult;
      
      if (existingAppointment) {
        // Update existing appointment
        appointmentResult = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointment.id);
      } else {
        // Insert new appointment
        appointmentResult = await supabase
          .from('appointments')
          .insert(appointmentData);
      }
      
      if (appointmentResult.error) {
        throw new Error(`Error saving appointment: ${appointmentResult.error.message}`);
      }
      
      // 2. If updating, delete existing related records
      if (existingAppointment) {
        // Delete existing services
        const { error: deleteServicesError } = await supabase
          .from('appointment_services')
          .delete()
          .eq('appointment_id', appointment.id);
        
        if (deleteServicesError) {
          throw new Error(`Error deleting appointment services: ${deleteServicesError.message}`);
        }
        
        // Delete existing employees
        const { error: deleteEmployeesError } = await supabase
          .from('appointment_employees')
          .delete()
          .eq('appointment_id', appointment.id);
        
        if (deleteEmployeesError) {
          throw new Error(`Error deleting appointment employees: ${deleteEmployeesError.message}`);
        }
        
        // Delete existing commissions
        const { error: deleteCommissionsError } = await supabase
          .from('appointment_commissions')
          .delete()
          .eq('appointment_id', appointment.id);
        
        if (deleteCommissionsError) {
          throw new Error(`Error deleting appointment commissions: ${deleteCommissionsError.message}`);
        }
      }
      
      // 3. Insert services
      if (appointment.services.length > 0) {
        const serviceData = appointment.services.map(service => ({
          appointment_id: appointment.id,
          service_id: service.serviceId,
          service_name: service.serviceName,
          price: service.price,
          commission_rate: service.commissionRate
        }));
        
        const { error: insertServicesError } = await supabase
          .from('appointment_services')
          .insert(serviceData);
        
        if (insertServicesError) {
          throw new Error(`Error inserting appointment services: ${insertServicesError.message}`);
        }
      }
      
      // 4. Insert employees
      if (appointment.employees.length > 0) {
        const employeeData = appointment.employees.map(employeeId => ({
          appointment_id: appointment.id,
          employee_id: employeeId
        }));
        
        const { error: insertEmployeesError } = await supabase
          .from('appointment_employees')
          .insert(employeeData);
        
        if (insertEmployeesError) {
          throw new Error(`Error inserting appointment employees: ${insertEmployeesError.message}`);
        }
      }
      
      // 5. Insert commissions
      if (appointment.commissions.length > 0) {
        const commissionData = appointment.commissions.map(commission => ({
          appointment_id: appointment.id,
          employee_id: commission.employeeId,
          employee_name: commission.employeeName,
          service_id: commission.serviceId,
          amount: commission.amount,
          commission_rate: commission.commissionRate
        }));
        
        const { error: insertCommissionsError } = await supabase
          .from('appointment_commissions')
          .insert(commissionData);
        
        if (insertCommissionsError) {
          throw new Error(`Error inserting appointment commissions: ${insertCommissionsError.message}`);
        }
      }
      
      // Commit the transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) {
        throw new Error(`Error committing transaction: ${commitError.message}`);
      }
      
      return true;
    } catch (error) {
      // Rollback the transaction on error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    console.error('Exception saving appointment:', error);
    return false;
  }
};

export const updateAppointmentStatus = async (
  appointmentId: string, 
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId);
    
    if (error) {
      console.error('Error updating appointment status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception updating appointment status:', error);
    return false;
  }
};

export const completeAppointment = async (
  appointmentId: string, 
  paymentMethod: 'cash' | 'transfer' | 'card'
): Promise<boolean> => {
  try {
    // First update the payment method in a custom field
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status: 'completed',
        notes: `Payment method: ${paymentMethod}` // Store payment method in notes
      })
      .eq('id', appointmentId);
    
    if (updateError) {
      console.error('Error completing appointment:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception completing appointment:', error);
    return false;
  }
};

export const deleteAppointment = async (appointmentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);
    
    if (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting appointment:', error);
    return false;
  }
};

// Appointment reminder services
export const getActiveReminders = async (userId: string): Promise<AppointmentReminder[]> => {
  try {
    const { data, error } = await supabase
      .from('appointment_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .lt('reminder_time', new Date().toISOString())
      .order('reminder_time');
    
    if (error) {
      console.error('Error getting active reminders:', error);
      return [];
    }
    
    return data.map(reminder => ({
      id: reminder.id,
      appointmentId: reminder.appointment_id,
      customerName: reminder.customer_name,
      customerPhone: reminder.customer_phone,
      licensePlate: reminder.license_plate,
      appointmentDate: new Date(reminder.appointment_date),
      appointmentTime: reminder.appointment_time,
      reminderTime: new Date(reminder.reminder_time),
      isRead: reminder.is_read,
      createdAt: new Date(reminder.created_at),
      userId: reminder.user_id
    }));
  } catch (error) {
    console.error('Exception getting active reminders:', error);
    return [];
  }
};

export const markReminderAsRead = async (reminderId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('appointment_reminders')
      .update({ is_read: true })
      .eq('id', reminderId);
    
    if (error) {
      console.error('Error marking reminder as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception marking reminder as read:', error);
    return false;
  }
};

// Dashboard statistics
export const getDashboardStats = async (userId: string): Promise<any> => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .rpc('get_user_dashboard_stats', {
        user_uuid: userId,
        target_date: today
      });
    
    if (error) {
      console.error('Error getting dashboard stats:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception getting dashboard stats:', error);
    return null;
  }
};

// License plate availability
export const isLicensePlateAvailableToday = async (
  licensePlate: string, 
  userId: string, 
  excludeId?: string,
  checkDate?: string
): Promise<boolean> => {
  try {
    // Use provided date or default to today
    const targetDate = checkDate || format(new Date(), 'yyyy-MM-dd');
    
    // Check transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('license_plate', licensePlate)
      .eq('date::date', targetDate)
      .neq('id', excludeId || '');
    
    if (transactionsError) {
      console.error('Error checking transactions:', transactionsError);
      return false;
    }
    
    if (transactions.length > 0) {
      return false;
    }
    
    // Check pending services
    const { data: pendingServices, error: pendingServicesError } = await supabase
      .from('pending_services')
      .select('id')
      .eq('user_id', userId)
      .eq('license_plate', licensePlate)
      .eq('date::date', targetDate)
      .neq('id', excludeId || '');
    
    if (pendingServicesError) {
      console.error('Error checking pending services:', pendingServicesError);
      return false;
    }
    
    if (pendingServices.length > 0) {
      return false;
    }
    
    // Check appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('user_id', userId)
      .eq('license_plate', licensePlate)
      .eq('appointment_date::date', targetDate)
      .not('status', 'in', '("cancelled")')
      .neq('id', excludeId || '');
    
    if (appointmentsError) {
      console.error('Error checking appointments:', appointmentsError);
      return false;
    }
    
    if (appointments.length > 0) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception checking license plate availability:', error);
    return false;
  }
};

export const getLicensePlateConflictMessage = async (
  licensePlate: string, 
  userId: string,
  checkDate?: string
): Promise<string> => {
  try {
    // Use provided date or default to today
    const targetDate = checkDate || format(new Date(), 'yyyy-MM-dd');
    const dateLabel = checkDate ? checkDate : 'өнөөдөр';
    
    // Check transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('license_plate', licensePlate)
      .eq('date::date', targetDate);
    
    if (transactionsError) {
      console.error('Error checking transactions:', transactionsError);
      return '';
    }
    
    if (transactions.length > 0) {
      return `${licensePlate} дугаартай машин ${dateLabel} аль хэдийн гүйлгээ хийсэн байна.`;
    }
    
    // Check pending services
    const { data: pendingServices, error: pendingServicesError } = await supabase
      .from('pending_services')
      .select('id')
      .eq('user_id', userId)
      .eq('license_plate', licensePlate)
      .eq('date::date', targetDate);
    
    if (pendingServicesError) {
      console.error('Error checking pending services:', pendingServicesError);
      return '';
    }
    
    if (pendingServices.length > 0) {
      return `${licensePlate} дугаартай машин ${dateLabel} хүлээгдэж буй үйлчилгээтэй байна.`;
    }
    
    // Check appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('user_id', userId)
      .eq('license_plate', licensePlate)
      .eq('appointment_date::date', targetDate)
      .not('status', 'in', '("cancelled")');
    
    if (appointmentsError) {
      console.error('Error checking appointments:', appointmentsError);
      return '';
    }
    
    if (appointments.length > 0) {
      return `${licensePlate} дугаартай машин ${dateLabel} цаг захиалгатай байна.`;
    }
    
    return '';
  } catch (error) {
    console.error('Exception getting license plate conflict message:', error);
    return '';
  }
};

// Report services
export const getTransactionsByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_transactions_by_date_range', {
        user_uuid: userId,
        start_date: startDate,
        end_date: endDate
      });
    
    if (error) {
      console.error('Error getting transactions by date range:', error);
      return [];
    }
    
    // Fetch full transaction details for each transaction
    const transactionIds = data.map((t: any) => t.id);
    
    if (transactionIds.length === 0) {
      return [];
    }
    
    const { data: transactionDetails, error: detailsError } = await supabase
      .from('transaction_details_view')
      .select('*')
      .in('id', transactionIds);
    
    if (detailsError) {
      console.error('Error getting transaction details:', detailsError);
      return [];
    }
    
    return transactionDetails.map((transaction: any) => ({
      id: transaction.id,
      licensePlate: transaction.license_plate,
      services: transaction.services || [],
      employees: transaction.employees || [],
      paymentMethod: transaction.payment_method as 'cash' | 'transfer' | 'card',
      totalAmount: transaction.total_amount,
      commissions: transaction.commissions || [],
      date: new Date(transaction.date),
      userId: transaction.user_id,
      status: transaction.status as 'completed' | 'pending',
      notes: transaction.notes || ''
    }));
  } catch (error) {
    console.error('Exception getting transactions by date range:', error);
    return [];
  }
};

export const getEmployeeStats = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_employee_stats', {
        user_uuid: userId,
        start_date: startDate,
        end_date: endDate
      });
    
    if (error) {
      console.error('Error getting employee stats:', error);
      return [];
    }
    
    return data.map((employee: any) => ({
      'Ажилтны нэр': employee.employee_name,
      'Нийт цалин': employee.total_commission,
      'Үйлчилгээний тоо': employee.service_count,
      'Орлогын хувь': employee.revenue_share,
      'Цалин олгосон': employee.paid_commissions,
      'Цалин олгоогүй': employee.unpaid_commissions,
      'employeeId': employee.employee_id
    }));
  } catch (error) {
    console.error('Exception getting employee stats:', error);
    return [];
  }
};

export const getServiceStats = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_service_stats', {
        user_uuid: userId,
        start_date: startDate,
        end_date: endDate
      });
    
    if (error) {
      console.error('Error getting service stats:', error);
      return [];
    }
    
    return data.map((service: any) => ({
      'Үйлчилгээний нэр': service.service_name,
      'Нийт орлого': service.total_revenue,
      'Хийгдсэн тоо': service.service_count,
      'Дундаж үнэ': service.average_price,
      'Нийт цалин': service.total_commission
    }));
  } catch (error) {
    console.error('Exception getting service stats:', error);
    return [];
  }
};

// Employee commission details
export const getUnpaidCommissions = async (employeeId: string): Promise<Commission[]> => {
  try {
    const { data, error } = await supabase
      .from('employee_commissions_view')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_paid', false)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error getting unpaid commissions:', error);
      return [];
    }
    
    return data.map(commission => ({
      id: commission.id,
      employeeId: commission.employee_id,
      employeeName: commission.employee_name,
      amount: commission.amount,
      serviceId: commission.service_id,
      commissionRate: commission.commission_rate,
      isPaid: commission.is_paid,
      notes: commission.notes || ''
    }));
  } catch (error) {
    console.error('Exception getting unpaid commissions:', error);
    return [];
  }
};