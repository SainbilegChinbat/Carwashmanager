import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle, Edit, Trash2, Phone, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import { Appointment } from '../../types';
import { getAppointments, updateAppointmentStatus, completeAppointment, deleteAppointment } from '../../utils/storage';
import { format } from 'date-fns';
import AppointmentEditForm from './AppointmentEditForm';

interface AppointmentsListProps {
  onClose: () => void;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!user) return;
    loadAppointments();
  }, [user]);

  const loadAppointments = () => {
    if (!user) return;
    const userAppointments = getAppointments(user.id);
    // Filter to show today's appointments and future appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const relevantAppointments = userAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate >= today && appointment.status !== 'completed';
    });
    
    setAppointments(relevantAppointments);
  };

  const handleStatusUpdate = (appointmentId: string, status: 'confirmed' | 'cancelled') => {
    updateAppointmentStatus(appointmentId, status);
    loadAppointments();
  };

  const handleDelete = (appointmentId: string) => {
    deleteAppointment(appointmentId);
    loadAppointments();
    setShowDeleteConfirm(null);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
  };

  const handleAppointmentUpdated = () => {
    loadAppointments();
    setEditingAppointment(null);
  };

  const handleCallCustomer = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return mn.scheduled;
      case 'confirmed': return mn.confirmed;
      case 'completed': return mn.completed;
      case 'cancelled': return mn.cancelled;
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-gray-900 w-full max-h-[90vh] rounded-t-3xl overflow-hidden">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl font-bold">{mn.appointmentsList}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {appointments.length} цаг захиалга
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">{mn.noData}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="bg-gray-800 rounded-2xl p-4">
                  {/* Header Section - Responsive Layout */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    {/* Left Content - Customer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <User size={16} className="text-blue-400 flex-shrink-0" />
                        <h3 className="text-white font-bold text-lg truncate">{appointment.customerName}</h3>
                        <span className={`${getStatusColor(appointment.status)} text-white text-xs px-2 py-1 rounded-full flex-shrink-0`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>
                      
                      {/* Contact Info - Stacked on Mobile */}
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          <button
                            onClick={() => handleCallCustomer(appointment.customerPhone)}
                            className="text-green-400 hover:text-green-300 text-sm underline truncate"
                          >
                            {appointment.customerPhone}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">
                            {format(appointment.appointmentDate, 'yyyy-MM-dd')} {appointment.appointmentTime}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {appointment.licensePlate}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right Content - Price and Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2">
                      <p className="text-green-400 font-bold text-lg sm:text-xl">₮{appointment.totalAmount.toLocaleString()}</p>
                      
                      {/* Action Buttons - Horizontal on Mobile, Vertical on Desktop */}
                      <div className="flex sm:flex-col gap-2">
                        {/* Edit Button - Available for scheduled and confirmed appointments */}
                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0"
                            title="Засах"
                          >
                            <Edit size={16} className="text-white" />
                          </button>
                        )}
                        
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                            className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors flex-shrink-0"
                            title="Баталгаажуулах"
                          >
                            <CheckCircle size={16} className="text-white" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => setShowDeleteConfirm(appointment.id)}
                          className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors flex-shrink-0"
                          title="Устгах"
                        >
                          <Trash2 size={16} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Services Section */}
                  <div className="space-y-2 mb-3">
                    {appointment.services.map((service, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300 truncate pr-2">{service.serviceName}</span>
                        <span className="text-white flex-shrink-0">₮{service.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Commissions Section */}
                  {appointment.commissions.length > 0 && (
                    <div className="border-t border-gray-700 pt-3 mb-3">
                      <p className="text-gray-400 text-xs mb-2">Цалин:</p>
                      <div className="space-y-1">
                        {appointment.commissions.map((commission, index) => (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 truncate pr-2">{commission.employeeName}</span>
                            <span className="text-yellow-400 flex-shrink-0">₮{commission.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes Section */}
                  {appointment.notes && (
                    <div className="border-t border-gray-700 pt-3">
                      <p className="text-gray-400 text-xs mb-1">Тэмдэглэл:</p>
                      <p className="text-gray-300 text-sm break-words">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <AppointmentEditForm
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSave={handleAppointmentUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white text-lg font-bold mb-4">{mn.confirmDelete}</h3>
            <p className="text-gray-400 mb-6">Энэ цаг захиалгыг устгахдаа итгэлтэй байна уу?</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {mn.cancel}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
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

export default AppointmentsList;