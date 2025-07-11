import React from 'react';
import { Bell, Phone, X, CheckCircle } from 'lucide-react';
import { AppointmentReminder } from '../../types';
import { mn } from '../../utils/mongolian';
import { format } from 'date-fns';

interface AppointmentRemindersProps {
  reminders: AppointmentReminder[];
  onMarkAsRead: (reminderId: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const AppointmentReminders: React.FC<AppointmentRemindersProps> = ({
  reminders,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose
}) => {
  const handleCallCustomer = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-gray-900 w-full max-h-[80vh] rounded-t-3xl overflow-hidden">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <Bell size={20} className="text-black" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">{mn.appointmentReminder}</h2>
                <p className="text-gray-400 text-sm">{reminders.length} сануулга</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {reminders.length > 1 && (
            <button
              onClick={onMarkAllAsRead}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle size={16} />
              <span>Бүгдийг уншсан гэж тэмдэглэх</span>
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Bell size={16} className="text-yellow-400" />
                      <h3 className="text-white font-bold text-lg">{reminder.customerName}</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-1">
                      Улсын дугаар: {reminder.licensePlate}
                    </p>
                    <p className="text-gray-300 text-sm mb-1">
                      Утас: {reminder.customerPhone}
                    </p>
                    <p className="text-yellow-400 text-sm">
                      Цаг захиалга: {format(reminder.appointmentDate, 'yyyy-MM-dd')} {reminder.appointmentTime}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCallCustomer(reminder.customerPhone)}
                      className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
                      title={mn.callCustomer}
                    >
                      <Phone size={16} className="text-white" />
                    </button>
                    <button
                      onClick={() => onMarkAsRead(reminder.id)}
                      className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                      title={mn.markAsRead}
                    >
                      <CheckCircle size={16} className="text-white" />
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-300 text-sm font-medium">
                    🔔 {mn.reminderMessage}
                  </p>
                  <p className="text-yellow-200 text-xs mt-1">
                    Үйлчлүүлэгч рүү залгаж цаг захиалгыг сануулна уу.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentReminders;