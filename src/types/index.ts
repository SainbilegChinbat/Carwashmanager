export interface User {
  id: string;
  email: string;
  businessName: string;
  phone?: string;
  address?: string;
  logo?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  commissionRate: number; // percentage
  userId: string;
  category?: string; // New field for service category
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  address: string;
  defaultCommissionRate: number; // percentage
  userId: string;
}

export interface Transaction {
  id: string;
  licensePlate: string;
  services: TransactionService[];
  employees: string[]; // employee IDs
  paymentMethod: 'cash' | 'transfer' | 'card';
  totalAmount: number;
  commissions: Commission[];
  date: Date;
  userId: string;
  status: 'completed' | 'pending';
  notes?: string;
}

export interface TransactionService {
  serviceId: string;
  serviceName: string;
  price: number;
  commissionRate: number;
}

export interface Commission {
  employeeId: string;
  employeeName: string;
  amount: number;
  serviceId: string;
  commissionRate: number; // Store the commission rate at time of transaction
  isPaid?: boolean; // Commission payment status
  notes?: string; // Commission notes
}

export interface DashboardStats {
  totalIncome: number;
  totalServices: number;
  totalCommissions: number;
  pendingServices: number;
  pendingAmount: number;
  appointmentCount: number;
  paymentMethods: {
    cash: number;
    transfer: number;
    card: number;
  };
}

export interface PendingService {
  id: string;
  licensePlate: string;
  services: TransactionService[];
  employees: string[];
  totalAmount: number;
  commissions: Commission[];
  date: Date;
  userId: string;
  estimatedCompletion?: Date;
  notes?: string;
}

export interface Appointment {
  id: string;
  licensePlate: string;
  customerName: string;
  customerPhone: string;
  services: TransactionService[];
  employees: string[];
  totalAmount: number;
  commissions: Commission[];
  appointmentDate: Date;
  appointmentTime: string;
  userId: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  reminderSent?: boolean;
}

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  customerName: string;
  customerPhone: string;
  licensePlate: string;
  appointmentDate: Date;
  appointmentTime: string;
  reminderTime: Date;
  isRead: boolean;
  createdAt: Date;
  userId: string;
}