import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';
import { Service } from '../../types';
import { getServices, saveService, deleteService, updateServiceCategory, deleteServiceCategory, getServiceCategories } from '../../utils/storage';

const ServicesSettings: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCategoryEdit, setShowCategoryEdit] = useState<string | null>(null);
  const [showCategoryDelete, setShowCategoryDelete] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newCategoryForServices, setNewCategoryForServices] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    commissionRate: '',
    category: ''
  });

  useEffect(() => {
    if (!user) return;
    loadServices();
  }, [user]);

  const loadServices = async () => {
    if (!user) return;
    const userServices = await getServices(user.id);
    setServices(userServices);
    
    // Auto-expand all categories initially
    const categories = new Set(userServices.map(s => s.category || 'Ерөнхий'));
    setExpandedCategories(categories);
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', commissionRate: '', category: '' });
    setEditingService(null);
    setShowForm(false);
  };

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name,
      price: service.price.toString(),
      commissionRate: service.commissionRate.toString(),
      category: service.category || ''
    });
    setEditingService(service);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const serviceData: Service = {
      id: editingService?.id || `${user.id}_service_${Date.now()}`,
      name: formData.name,
      price: parseInt(formData.price),
      commissionRate: parseInt(formData.commissionRate),
      userId: user.id,
      category: formData.category || 'Ерөнхий'
    };

    const success = await saveService(serviceData);
    if (success) {
      await loadServices();
      resetForm();
    }
  };

  const handleDelete = async (serviceId: string) => {
    const success = await deleteService(serviceId);
    if (success) {
      await loadServices();
    }
    setShowDeleteConfirm(null);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryEdit = (category: string) => {
    setEditingCategoryName(category);
    setShowCategoryEdit(category);
  };

  const handleCategoryEditSave = async () => {
    if (!user || !showCategoryEdit || !editingCategoryName.trim()) return;
    
    if (editingCategoryName.trim() === showCategoryEdit) {
      setShowCategoryEdit(null);
      return;
    }

    const success = await updateServiceCategory(showCategoryEdit, editingCategoryName.trim(), user.id);
    if (success) {
      await loadServices();
      setShowCategoryEdit(null);
      setEditingCategoryName('');
    }
  };

  const handleCategoryDelete = (category: string) => {
    if (category === 'Ерөнхий') {
      alert('Ерөнхий ангиллыг устгах боломжгүй');
      return;
    }
    setNewCategoryForServices('Ерөнхий');
    setShowCategoryDelete(category);
  };

  const handleCategoryDeleteConfirm = async () => {
    if (!user || !showCategoryDelete || !newCategoryForServices) return;

    const success = await deleteServiceCategory(showCategoryDelete, newCategoryForServices, user.id);
    if (success) {
      await loadServices();
      setShowCategoryDelete(null);
      setNewCategoryForServices('');
    }
  };

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

  // Get available categories for moving services
  const availableCategories = Array.from(new Set([
    ...sortedCategories
  ])).filter(cat => cat !== showCategoryDelete);

  return (
    <div className="space-y-6">
      {/* Add Service Button */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <Plus size={20} />
        <span>{mn.addService}</span>
      </button>

      {/* Services List by Category */}
      <div className="space-y-4">
        {sortedCategories.map((category) => (
          <div key={category} className="bg-gray-800 rounded-2xl overflow-hidden">
            {/* Category Header */}
            <div className="p-4 bg-gray-700 flex items-center justify-between">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center space-x-3 flex-1"
              >
                {expandedCategories.has(category) ? (
                  <ChevronDown size={20} className="text-gray-400" />
                ) : (
                  <ChevronRight size={20} className="text-gray-400" />
                )}
                {showCategoryEdit === category ? (
                  <input
                    type="text"
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCategoryEditSave();
                      } else if (e.key === 'Escape') {
                        setShowCategoryEdit(null);
                        setEditingCategoryName('');
                      }
                    }}
                    className="bg-gray-600 text-white px-2 py-1 rounded text-lg font-bold flex-1"
                    autoFocus
                  />
                ) : (
                  <h3 className="text-white font-bold text-lg">{category}</h3>
                )}
                <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
                  {groupedServices[category].length}
                </span>
              </button>

              {/* Category Actions */}
              <div className="flex items-center space-x-2 ml-3">
                {showCategoryEdit === category ? (
                  <>
                    <button
                      onClick={handleCategoryEditSave}
                      className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
                      title="Хадгалах"
                    >
                      <Save size={16} className="text-white" />
                    </button>
                    <button
                      onClick={() => {
                        setShowCategoryEdit(null);
                        setEditingCategoryName('');
                      }}
                      className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                      title="Цуцлах"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleCategoryEdit(category)}
                      className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                      title="Ангилал засах"
                    >
                      <Edit size={16} className="text-white" />
                    </button>
                    {category !== 'Ерөнхий' && (
                      <button
                        onClick={() => handleCategoryDelete(category)}
                        className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                        title="Ангилал устгах"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Category Services */}
            {expandedCategories.has(category) && (
              <div className="divide-y divide-gray-700">
                {groupedServices[category].map((service) => (
                  <div key={service.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-lg">{service.name}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-green-400 font-medium">₮{service.price.toLocaleString()}</span>
                          <span className="text-yellow-400 text-sm">{service.commissionRate}% цалин</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                        >
                          <Edit size={16} className="text-white" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(service.id)}
                          className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={16} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {services.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">Үйлчилгээ байхгүй</div>
            <p className="text-gray-500 text-sm mt-2">Эхний үйлчилгээгээ нэмээрэй</p>
          </div>
        )}
      </div>

      {/* Service Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-bold">
                {editingService ? mn.editService : mn.addService}
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
                  Ангилал
                </label>
                <div className="space-y-2">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                  >
                    <option value="">Ангилал сонгох...</option>
                    <option value="Ерөнхий">Ерөнхий</option>
                    {Array.from(new Set(services.map(s => s.category || 'Ерөнхий')))
                      .filter(category => category !== 'Ерөнхий')
                      .sort()
                      .map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="Эсвэл шинэ ангилал бичих"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {mn.serviceName}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="Үйлчилгээний нэр"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {mn.price} (₮)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="15000"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {mn.commissionRate} (%)
                </label>
                <input
                  type="number"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="15"
                  required
                  min="0"
                  max="100"
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

      {/* Delete Service Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white text-lg font-bold mb-4">{mn.confirmDelete}</h3>
            <p className="text-gray-400 mb-6">Энэ үйлчилгээг устгахдаа итгэлтэй байна уу?</p>
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

      {/* Delete Category Confirmation Modal */}
      {showCategoryDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white text-lg font-bold mb-4">Ангилал устгах</h3>
            <p className="text-gray-400 mb-4">
              <strong>{showCategoryDelete}</strong> ангиллыг устгахдаа итгэлтэй байна уу?
            </p>
            <p className="text-yellow-400 text-sm mb-6">
              Энэ ангилалд хамаарах бүх үйлчилгээнүүд өөр ангилал руу шилжинэ.
            </p>
            
            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-2">
                Үйлчилгээнүүдийг шилжүүлэх ангилал:
              </label>
              <select
                value={newCategoryForServices}
                onChange={(e) => setNewCategoryForServices(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                required
              >
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCategoryDelete(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {mn.cancel}
              </button>
              <button
                onClick={handleCategoryDeleteConfirm}
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

export default ServicesSettings;