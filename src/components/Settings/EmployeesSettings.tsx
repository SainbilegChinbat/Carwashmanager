import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import { Employee } from '../../types';
import { getEmployees, saveEmployee, deleteEmployee } from '../../utils/storage';

const EmployeesSettings: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    defaultCommissionRate: ''
  });

  useEffect(() => {
    if (!user) return;
    setEmployees(getEmployees(user.id));
  }, [user]);

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', defaultCommissionRate: '' });
    setEditingEmployee(null);
    setShowForm(false);
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      name: employee.name,
      phone: employee.phone,
      address: employee.address,
      defaultCommissionRate: employee.defaultCommissionRate.toString()
    });
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const employeeData: Employee = {
      id: editingEmployee?.id || `${user.id}_employee_${Date.now()}`,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      defaultCommissionRate: parseInt(formData.defaultCommissionRate),
      userId: user.id
    };

    saveEmployee(employeeData);
    setEmployees(getEmployees(user.id));
    resetForm();
  };

  const handleDelete = (employeeId: string) => {
    deleteEmployee(employeeId);
    setEmployees(getEmployees(user.id));
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Employee Button */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <Plus size={20} />
        <span>{mn.addEmployee}</span>
      </button>

      {/* Employees List */}
      <div className="space-y-4">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-gray-800 rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg">{employee.name}</h3>
                  <p className="text-yellow-400 text-sm mb-1">{employee.defaultCommissionRate}% үндсэн цалин</p>
                  <p className="text-gray-300 text-sm">{mn.phone}: {employee.phone}</p>
                  <p className="text-gray-300 text-sm break-words">{mn.address}: {employee.address}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(employee)}
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Edit size={16} className="text-white" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(employee.id)}
                  className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-bold">
                {editingEmployee ? mn.editEmployee : mn.addEmployee}
              </h3>
              <button
                onClick={resetForm}
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {mn.employeeName}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="Ажилтны нэр"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {mn.phone}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="99123456"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Цалингийн хувь (%)
                </label>
                <input
                  type="number"
                  value={formData.defaultCommissionRate}
                  onChange={(e) => setFormData({ ...formData, defaultCommissionRate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="15"
                  required
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {mn.address}
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors resize-none"
                  placeholder="Гэрийн хаяг"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  {mn.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Save size={20} />
                  <span>{mn.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white text-lg font-bold mb-4">{mn.confirmDelete}</h3>
            <p className="text-gray-400 mb-6">Энэ ажилтныг устгахдаа итгэлтэй байна уу?</p>
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

export default EmployeesSettings;