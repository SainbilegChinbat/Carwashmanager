import React, { useState, useEffect } from 'react';
import { Save, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mn } from '../../utils/mongolian';

const BusinessProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    businessName: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        businessName: user.businessName || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const updatedUser = {
        ...user,
        businessName: formData.businessName,
        phone: formData.phone,
        address: formData.address
      };

      const success = await updateProfile(updatedUser);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Мэдээлэл шинэчлэхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Мэдээлэл шинэчлэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <User size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">{mn.businessProfile}</h2>
            <p className="text-gray-400">Бизнесийн мэдээллээ шинэчлэх</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {mn.businessName}
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
              placeholder="Автомашин угаалгын газрын нэр"
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
              placeholder="Бизнесийн хаяг"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-400 text-sm">Мэдээлэл амжилттай шинэчлэгдлээ!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Save size={20} />
            <span>{loading ? mn.loading : mn.save}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default BusinessProfile;