import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Clock, CheckCircle, AlertTriangle, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import { Service, Employee, Transaction, TransactionService, Commission, PendingService, Appointment } from '../../types';
import { getServices, getEmployees, saveTransaction, savePendingService, saveAppointment, isLicensePlateAvailableToday, getLicensePlateConflictMessage } from '../../utils/storage';

interface TransactionFormProps {
  onClose: (shouldRefresh?: boolean) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose }) => {
  const { user } = useAuth();
  
  const [formType, setFormType] = useState<'transaction' | 'pending' | 'appointment'>('transaction');
  const [formData, setFormData] = useState({
    licensePlate: '',
    customerName: '',
    customerPhone: '',
    selectedServices: [] as (TransactionService & { quantity: number })[],
    selectedEmployees: [] as string[],
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'card',
    notes: '',
    estimatedCompletion: '',
    appointmentDate: '',
    appointmentTime: '',
    transactionDate: new Date().toISOString().split('T')[0] // Add transaction date field
  });
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showServiceSelect, setShowServiceSelect] = useState(false);
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false);
  const [licensePlateError, setLicensePlateError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const userServices = await getServices(user.id);
    const userEmployees = await getEmployees(user.id);
    setServices(userServices);
    setEmployees(userEmployees);
    
    // Auto-expand all categories initially
    const categories = new Set(userServices.map(s => s.category || 'Ерөнхий'));
    setExpandedCategories(categories);
  };

  // Validate license plate when it changes
  useEffect(() => {
    if (formData.licensePlate && user && formType !== 'appointment') {
      // For transactions, use the selected date for validation
      const checkDate = formType === 'transaction' ? formData.transactionDate : undefined;
      const checkConflict = async () => {
        const errorMessage = await getLicensePlateConflictMessage(formData.licensePlate, user.id, checkDate);
        setLicensePlateError(errorMessage);
      };
      checkConflict();
    } else {
      setLicensePlateError(null);
    }
  }, [formData.licensePlate, formData.transactionDate, user, formType]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const addService = (service: Service) => {
    const existing = formData.selectedServices.find(s => s.serviceId === service.id);
    if (existing) {
      setFormData({
        ...formData,
        selectedServices: formData.selectedServices.map(s =>
          s.serviceId === service.id ? { ...s, quantity: s.quantity + 1 } : s
        )
      });
    } else {
      setFormData({
        ...formData,
        selectedServices: [...formData.selectedServices, {
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          commissionRate: service.commissionRate,
          quantity: 1
        }]
      });
    }
    setShowServiceSelect(false);
  };

  const removeService = (serviceId: string) => {
    setFormData({
      ...formData,
      selectedServices: formData.selectedServices.filter(s => s.serviceId !== serviceId)
    });
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId);
      return;
    }
    setFormData({
      ...formData,
      selectedServices: formData.selectedServices.map(s =>
        s.serviceId === serviceId ? { ...s, quantity } : s
      )
    });
  };

  const toggleEmployee = (employeeId: string) => {
    const isSelected = formData.selectedEmployees.includes(employeeId);
    if (isSelected) {
      setFormData({
        ...formData,
        selectedEmployees: formData.selectedEmployees.filter(id => id !== employeeId)
      });
    } else {
      setFormData({
        ...formData,
        selectedEmployees: [...formData.selectedEmployees, employeeId]
      });
    }
  };

  const calculateTotal = () => {
    return formData.selectedServices.reduce((sum, service) => 
      sum + (service.price * service.quantity), 0
    );
  };

  const calculateCommissions = (): Commission[] => {
    const commissions: Commission[] = [];
    const selectedEmployeeObjects = employees.filter(e => formData.selectedEmployees.includes(e.id));
    
    if (selectedEmployeeObjects.length === 0) return commissions;

    // Calculate total commission rate from all selected employees
    const totalEmployeeCommissionRate = selectedEmployeeObjects.reduce((sum, emp) => sum + emp.defaultCommissionRate, 0);
    
    // If total commission rate is 0, avoid division by zero
    if (totalEmployeeCommissionRate === 0) return commissions;

    formData.selectedServices.forEach(service => {
      const totalServiceRevenue = service.price * service.quantity;
      const totalServiceCommission = totalServiceRevenue * (service.commissionRate / 100);

      selectedEmployeeObjects.forEach(employee => {
        // Calculate this employee's share based on their commission rate relative to total
        const employeeShare = employee.defaultCommissionRate / totalEmployeeCommissionRate;
        const employeeCommission = totalServiceCommission * employeeShare;

        const existingCommission = commissions.find(c => c.employeeId === employee.id);
        if (existingCommission) {
          existingCommission.amount += employeeCommission;
        } else {
          commissions.push({
            employeeId: employee.id,
            employeeName: employee.name,
            amount: employeeCommission,
            serviceId: service.serviceId,
            commissionRate: employee.defaultCommissionRate,
            isPaid: false, // Default to false for new commissions
            notes: '' // Default to empty string
          });
        }
      });
    });

    return commissions;
  };

  const isFormValid = () => {
    const baseValid = formData.selectedServices.length > 0 && formData.licensePlate;
    
    if (formType === 'transaction') {
      return baseValid && !licensePlateError;
    } else if (formType === 'pending') {
      return baseValid && !licensePlateError;
    } else if (formType === 'appointment') {
      return baseValid && formData.customerName && formData.customerPhone && 
             formData.appointmentDate && formData.appointmentTime;
    }
    
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormValid()) return;

    let success = false;

    if (formType === 'transaction') {
      // Use the selected transaction date but with current time
      const transactionDate = new Date(formData.transactionDate);
      const now = new Date();
      transactionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      
      const transaction: Transaction = {
        id: Date.now().toString(),
        licensePlate: formData.licensePlate,
        services: formData.selectedServices.map(s => ({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          price: s.price * s.quantity,
          commissionRate: s.commissionRate
        })),
        employees: formData.selectedEmployees,
        paymentMethod: formData.paymentMethod,
        totalAmount: calculateTotal(),
        commissions: calculateCommissions(),
        date: transactionDate, // Use selected date with current time
        userId: user.id,
        status: 'completed',
        notes: formData.notes
      };

      success = await saveTransaction(transaction);
    } else if (formType === 'pending') {
      const pendingService: PendingService = {
        id: Date.now().toString(),
        licensePlate: formData.licensePlate,
        services: formData.selectedServices.map(s => ({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          price: s.price * s.quantity,
          commissionRate: s.commissionRate
        })),
        employees: formData.selectedEmployees,
        totalAmount: calculateTotal(),
        commissions: calculateCommissions(),
        date: new Date(), // This already captures full timestamp
        userId: user.id,
        estimatedCompletion: formData.estimatedCompletion ? new Date(formData.estimatedCompletion) : undefined,
        notes: formData.notes
      };

      success = await savePendingService(pendingService);
    } else if (formType === 'appointment') {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
      
      const appointment: Appointment = {
        id: Date.now().toString(),
        licensePlate: formData.licensePlate,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        services: formData.selectedServices.map(s => ({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          price: s.price * s.quantity,
          commissionRate: s.commissionRate
        })),
        employees: formData.selectedEmployees,
        totalAmount: calculateTotal(),
        commissions: calculateCommissions(),
        appointmentDate: appointmentDateTime, // This already captures full timestamp
        appointmentTime: formData.appointmentTime,
        userId: user.id,
        status: 'scheduled',
        notes: formData.notes,
        createdAt: new Date() // This already captures full timestamp
      };

      success = await saveAppointment(appointment);
    }

    onClose(success);
  };

  const getFormTitle = () => {
    switch (formType) {
      case 'transaction': return mn.newTransaction;
      case 'pending': return mn.saveAsPending;
      case 'appointment': return mn.newAppointment;
      default: return mn.newTransaction;
    }
  };

  const getSubmitButtonText = () => {
    switch (formType) {
      case 'transaction': return mn.completeTransaction;
      case 'pending': return mn.saveAsPending;
      case 'appointment': return mn.scheduleAppointment;
      default: return mn.completeTransaction;
    }
  };

  const getSubmitButtonIcon = () => {
    switch (formType) {
      case 'transaction': return CheckCircle;
      case 'pending': return Clock;
      case 'appointment': return Calendar;
      default: return CheckCircle;
    }
  };

  const getButtonColor = (buttonType: string) => {
    if (formType === buttonType) {
      switch (buttonType) {
        case 'transaction': return 'bg-green-500 text-white';
        case 'pending': return 'bg-yellow-500 text-white';
        case 'appointment': return 'bg-blue-500 text-white';
        default: return 'bg-green-500 text-white';
      }
    }
    return 'bg-gray-800 text-gray-400 hover:text-gray-300';
  };

  const SubmitIcon = getSubmitButtonIcon();

  // Group services by category
  const groupedServices = services.reduce((groups, service) => {
    const category = service.category || 'Ерөнхий';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(service);
    return groups;
  }, {} as Record<string, Service[]>);

  // Sort categories alphabetically, but keep 'Ерөнхий' first
  const sortedCategories = Object.keys(groupedServices).sort((a, b) => {
    if (a === 'Ерөнхий') return -1;
    if (b === 'Ерөнхий') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-gray-900 w-full max-h-[90vh] rounded-t-3xl overflow-hidden">
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-bold">{getFormTitle()}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Form Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'transaction', label: 'Гүйлгээ', icon: CheckCircle },
              { id: 'pending', label: 'Хүлээгдэж буй', icon: Clock },
              { id: 'appointment', label: 'Цаг захиалга', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFormType(id as any)}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg transition-colors ${getButtonColor(id)}`}
              >
                <Icon size={14} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form className="space-y-6">
            {/* Customer Information for Appointments */}
            {formType === 'appointment' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {mn.customerName}
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors text-ellipsis"
                    placeholder="Үйлчлүүлэгчийн нэр"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {mn.customerPhone}
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors text-ellipsis"
                    placeholder="99123456"
                    required
                  />
                </div>
              </div>
            )}

            {/* License Plate */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                {mn.licensePlate}
              </label>
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors text-ellipsis ${
                  licensePlateError 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-700 focus:border-green-500'
                }`}
                placeholder="1234УНН"
                required
              />
              {licensePlateError && (
                <div className="mt-2 flex items-center space-x-2 text-red-400">
                  <AlertTriangle size={16} />
                  <span className="text-sm">{licensePlateError}</span>
                </div>
              )}
            </div>

            {/* Transaction Date - Only for completed transactions */}
            {formType === 'transaction' && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Гүйлгээний огноо
                </label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                  required
                />
              </div>
            )}

            {/* Appointment Date and Time */}
            {formType === 'appointment' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {mn.appointmentDate}
                  </label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {mn.appointmentTime}
                  </label>
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            {/* Services */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                {mn.selectServices}
              </label>
              {formData.selectedServices.map(service => (
                <div key={service.serviceId} className="bg-gray-800 p-4 rounded-lg mb-2 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{service.serviceName}</h3>
                    <p className="text-gray-400 text-sm">₮{service.price.toLocaleString()} x {service.quantity}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-sm">Тоо: {service.quantity}</span>
                    <button
                      type="button"
                      onClick={() => removeService(service.serviceId)}
                      className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center ml-2"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => setShowServiceSelect(true)}
                className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors"
              >
                + {mn.selectServices}
              </button>
            </div>

            {/* Employees */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                {mn.selectEmployees}
              </label>
              <div className="space-y-2">
                {formData.selectedEmployees.map(employeeId => {
                  const employee = employees.find(e => e.id === employeeId);
                  return employee ? (
                    <div key={employeeId} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-white">{employee.name}</span>
                        <p className="text-gray-400 text-xs">{employee.defaultCommissionRate}% цалингийн хувь</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleEmployee(employeeId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
              
              <button
                type="button"
                onClick={() => setShowEmployeeSelect(true)}
                className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors mt-2"
              >
                + {mn.selectEmployees}
              </button>
            </div>

            {/* Commission Preview */}
            {formData.selectedEmployees.length > 0 && formData.selectedServices.length > 0 && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Цалингийн урьдчилсан тооцоо:</h4>
                <div className="space-y-1">
                  {calculateCommissions().map((commission, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <span className="text-gray-300">{commission.employeeName}</span>
                        <span className="text-gray-500 text-xs ml-2">({commission.commissionRate}%)</span>
                      </div>
                      <span className="text-yellow-400">₮{commission.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-700 mt-2 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 font-medium">Нийт цалин:</span>
                    <span className="text-yellow-400 font-bold">
                      ₮{calculateCommissions().reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method - Only for completed transactions */}
            {formType === 'transaction' && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {mn.paymentMethod}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'cash', label: mn.cash },
                    { value: 'transfer', label: mn.transfer },
                    { value: 'card', label: mn.card }
                  ].map(method => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: method.value as any })}
                      className={`p-3 rounded-lg border transition-colors ${
                        formData.paymentMethod === method.value
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                {mn.notes}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors resize-none"
                placeholder="Нэмэлт тэмдэглэл..."
              />
            </div>

            {/* Estimated Completion - Only for pending services */}
            {formType === 'pending' && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {mn.estimatedCompletion}
                </label>
                <input
                  type="datetime-local"
                  value={formData.estimatedCompletion}
                  onChange={(e) => setFormData({ ...formData, estimatedCompletion: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            )}

            {/* Total */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{mn.totalAmount}</span>
                <span className="text-green-400 text-xl font-bold">₮{calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => onClose(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {mn.cancel}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <SubmitIcon size={20} />
                <span>{getSubmitButtonText()}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Service Select Modal */}
      {showServiceSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end z-50">
          <div className="bg-gray-900 w-full max-h-[60vh] rounded-t-3xl">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-bold">{mn.selectServices}</h3>
                <button
                  onClick={() => setShowServiceSelect(false)}
                  className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(60vh-100px)]">
              {sortedCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Үйлчилгээ байхгүй</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedCategories.map((category) => (
                    <div key={category} className="bg-gray-800 rounded-xl overflow-hidden">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full p-3 flex items-center justify-between bg-gray-700 hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {expandedCategories.has(category) ? (
                            <ChevronDown size={16} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400" />
                          )}
                          <h4 className="text-white font-medium">{category}</h4>
                          <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
                            {groupedServices[category].length}
                          </span>
                        </div>
                      </button>

                      {/* Category Services */}
                      {expandedCategories.has(category) && (
                        <div className="divide-y divide-gray-700">
                          {groupedServices[category].map(service => (
                            <button
                              key={service.id}
                              onClick={() => addService(service)}
                              className="w-full p-3 text-left hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="text-white font-medium">{service.name}</h4>
                                  <p className="text-gray-400 text-sm">₮{service.price.toLocaleString()}</p>
                                </div>
                                <Plus size={20} className="text-green-400" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Select Modal */}
      {showEmployeeSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end z-50">
          <div className="bg-gray-900 w-full max-h-[60vh] rounded-t-3xl">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-bold">{mn.selectEmployees}</h3>
                <button
                  onClick={() => setShowEmployeeSelect(false)}
                  className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(60vh-100px)]">
              {employees.map(employee => (
                <button
                  key={employee.id}
                  onClick={() => {
                    toggleEmployee(employee.id);
                    setShowEmployeeSelect(false);
                  }}
                  className={`w-full p-4 rounded-lg mb-2 text-left transition-colors ${
                    formData.selectedEmployees.includes(employee.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{employee.name}</h4>
                      <p className="text-sm opacity-80">{employee.defaultCommissionRate}% цалингийн хувь</p>
                    </div>
                    {formData.selectedEmployees.includes(employee.id) && (
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;