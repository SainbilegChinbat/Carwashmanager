import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppointmentReminder } from '../types';
import { getActiveReminders, markReminderAsRead, showAppointmentNotification, requestNotificationPermission } from '../utils/storage';

export const useAppointmentReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<AppointmentReminder[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission().then(setHasPermission);
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const activeReminders = getActiveReminders(user.id);
      setReminders(activeReminders);

      // Show notifications for new reminders
      activeReminders.forEach(reminder => {
        if (hasPermission) {
          showAppointmentNotification(reminder);
        }
      });
    };

    // Check immediately
    checkReminders();

    // Check every minute
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [user, hasPermission]);

  const markAsRead = (reminderId: string) => {
    markReminderAsRead(reminderId);
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const markAllAsRead = () => {
    reminders.forEach(reminder => {
      markReminderAsRead(reminder.id);
    });
    setReminders([]);
  };

  return {
    reminders,
    hasPermission,
    markAsRead,
    markAllAsRead,
    requestPermission: () => requestNotificationPermission().then(setHasPermission)
  };
};