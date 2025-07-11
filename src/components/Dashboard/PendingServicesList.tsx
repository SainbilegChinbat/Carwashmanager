import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, Edit, Trash2, Car, Users, Calendar, User, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import { PendingService, Appointment } from '../../types';
import { getPendingServices, completePendingService, deletePendingService, getAppointments, completeAppointment, deleteAppointment } from '../../utils/storage';
import { format } from 'date-fns';

interface PendingServicesListProps {
  onClose: () => void;
}

interface PendingItem {
  id: string;
  type: 'service' | 'appointment';
  licensePlate: string;
  date: Date;
  totalAmount: number;
  services: any[];
  commissions: any[];
  employees: string[];
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  appointmentTime?: string;
  status?: string;
}

const PendingServicesList: React.FC<PendingServicesListProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [showCompleteModal, setShowCompleteModal] = useState<{ id: string; type: 'service' | 'appointment' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; type: 'service' | 'appointment' } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');

  useEffect(() => {
    if (!user) return;
    loadPendingItems();
  }, [user]);

  const loadPendingItems = () => {
    if (!user) return;
    
    const pendingServices = getPendingServices(user.id);
    const appointments = getAppointments(user.id);
    
    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter pending appointments to only include those that are due today or in the past
    const pendingAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.appointmentDate);
      appointmentDate.setHours(0, 0, 0, 0);
      
      // Only include appointments that are:
      // 1. Today or in the past (appointmentDate <= today)
      // 2. Not completed or cancelled
      return appointmentDate <= today && 
             (a.status === 'scheduled' || a.status === 'confirmed');
    });

    const items: PendingItem[] = [
      ...pendingServices.map(service => ({
        id: service.id,
        type: 'service' as const,
        licensePlate: service.licensePlate,
        date: service.date,
        totalAmount: service.totalAmount,
        services: service.services,
        commissions: service.commissions,
        employees: service.employees,
        notes: service.notes
      })),
      ...pendingAppointments.map(appointment => ({
        id: appointment.id,
        type: 'appointment' as const,
        licensePlate: appointment.licensePlate,
        date: appointment.appointmentDate,
        totalAmount: appointment.totalAmount,
        services: appointment.services,
        commissions: appointment.commissions,
        employees: appointment.employees,
        notes: appointment.notes,
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        appointmentTime: appointment.appointmentTime,
        status: appointment.status
      }))
    ];

    // Sort by date
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setPendingItems(items);
  };

  const handleComplete = (id: string, type: 'service' | 'appointment') => {
    if (type === 'service') {
      completePendingService(id, selectedPaymentMethod);
    } else {
      completeAppointment(id, selectedPaymentMethod);
    }
    loadPendingItems();
    setShowCompleteModal(null);
  };

  const handleDelete = (id: string, type: 'service' | 'appointment') => {
    if (type === 'service') {
      deletePendingService(id);
    } else {
      deleteAppointment(id);
    }
    loadPendingItems();
    setShowDeleteConfirm(null);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Товлосон';
      case 'confirmed': return 'Баталгаажсан';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'confirmed': return 'bg-green-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-gray-900 w-full max-h-[90vh] rounded-t-3xl overflow-hidden">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl font-bold">Хүлээгдэж буй үйлчилгээ</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {pendingItems.length} хүлээгдэж буй үйлчилгээ ба цаг захиалга
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {pendingItems.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">{mn.noData}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="bg-gray-800 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {item.type === 'appointment' ? (
                          <Calendar size={16} className="text-blue-400" />
                        ) : (
                          <Car size={16} className="text-green-400" />
                        )}
                        <h3 className="text-white font-bold text-lg">{item.licensePlate}</h3>
                        {item.type === 'appointment' && item.status && (
                          <span className={`${getStatusColor(item.status)} text-white text-xs px-2 py-1 rounded-full`}>
                            {getStatusLabel(item.status)}
                          </span>
                        )}
                        {item.type === 'service' && (
                          <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                            {mn.pending}
                          </span>
                        )}
                      </div>
                      
                      {/* Customer info for appointments */}
                      {item.type === 'appointment' && (
                        <div className="mb-2">
                          <div className="flex items-center space-x-1 mb-1">
                            <User size={14} className="text-gray-400" />
                            <span className="text-gray-300 text-sm">{item.customerName}</span>
                          </div>
                          <div className="flex items-center space-x-1 mb-1">
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-gray-300 text-sm">{item.customerPhone}</span>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-gray-400 text-sm mb-2">
                        {item.type === 'appointment' 
                          ? `${format(item.date, 'yyyy-MM-dd')} ${item.appointmentTime}`
                          : format(item.date, 'yyyy-MM-dd HH:mm')
                        }
                      </p>
                      
                      {item.employees.length > 0 && (
                        <div className="flex items-center space-x-1 mb-2">
                          <Users size={14} className="text-gray-400" />
                          <span className="text-gray-300 text-sm">
                            {item.employees.length} ажилтан
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg">₮{item.totalAmount.toLocaleString()}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => setShowCompleteModal({ id: item.id, type: item.type })}
                          className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={16} className="text-white" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm({ id: item.id, type: item.type })}
                          className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={16} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-2 mb-3">
                    {item.services.map((service, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">{service.serviceName}</span>
                        <span className="text-white">₮{service.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Commissions */}
                  {item.commissions.length > 0 && (
                    <div className="border-t border-gray-700 pt-3">
                      <p className="text-gray-400 text-xs mb-2">Цалин:</p>
                      <div className="space-y-1">
                        {item.commissions.map((commission, index) => (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">{commission.employeeName}</span>
                            <span className="text-yellow-400">₮{commission.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="border-t border-gray-700 pt-3 mt-3">
                      <p className="text-gray-400 text-xs mb-1">Тэмдэглэл:</p>
                      <p className="text-gray-300 text-sm">{item.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Service Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white text-lg font-bold mb-4">
              {showCompleteModal.type === 'appointment' ? 'Цаг захиалга дуусгах' : mn.completeTransaction}
            </h3>
            <p className="text-gray-400 mb-6">Төлбөрийн хэрэгсэл сонгоно уу:</p>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { value: 'cash', label: mn.cash },
                { value: 'transfer', label: mn.transfer },
                { value: 'card', label: mn.card }
              ].map(method => (
                <button
                  key={method.value}
                  onClick={() => setSelectedPaymentMethod(method.value as any)}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedPaymentMethod === method.value
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowCompleteModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {mn.cancel}
              </button>
              <button
                onClick={() => handleComplete(showCompleteModal.id, showCompleteModal.type)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {showCompleteModal.type === 'appointment' ? 'Дуусгах' : mn.completeTransaction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white text-lg font-bold mb-4">{mn.confirmDelete}</h3>
            <p className="text-gray-400 mb-6">
              {showDeleteConfirm.type === 'appointment' 
                ? 'Энэ цаг захиалгыг устгахдаа итгэлтэй байна уу?'
                : 'Энэ хүлээгдэж буй үйлчилгээг устгахдаа итгэлтэй байна уу?'
              }
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {mn.cancel}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id, showDeleteConfirm.type)}
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

export default PendingServicesList;