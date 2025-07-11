import React, { useState } from 'react';
import { Eye, EyeOff, Car } from 'lucide-react';
import { mn } from '../../utils/mongolian';
import { useAuth } from '../../contexts/AuthContext';

interface SignupFormProps {
  onToggleMode: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form data
      if (!formData.email.trim()) {
        setError('И-мэйл хаягаа оруулна уу');
        setLoading(false);
        return;
      }

      if (!formData.password) {
        setError('Нууц үгээ оруулна уу');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой');
        setLoading(false);
        return;
      }

      if (!formData.businessName.trim()) {
        setError('Бизнесийн нэрээ оруулна уу');
        setLoading(false);
        return;
      }

      const userData = {
        email: formData.email.trim(),
        password: formData.password,
        businessName: formData.businessName.trim()
      };

      const success = await register(userData);
      if (!success) {
        setError('Энэ и-мэйл хаягаар аль хэдийн бүртгүүлсэн байна эсвэл алдаа гарлаа');
      }
    } catch (err) {
      console.error('SignupForm: Registration error:', err);
      setError('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center px-6">
      <div className="max-w-sm mx-auto w-full">
        {/* Logo and App Name */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <Car size={32} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-white text-2xl font-bold">CARWASH</h1>
              <h2 className="text-green-400 text-xl font-bold">MANAGER</h2>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Шинэ бүртгэл үүсгэх</h3>
          <p className="text-gray-400">Шинэ бүртгэл үүсгээд удирдаж эхлээрэй!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {mn.email}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
              placeholder="И-мэйл хаягаа оруулна уу"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {mn.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors pr-12"
                placeholder="Нууц үгээ оруулна уу"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {mn.businessName}
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
              placeholder="Автомашин угаалгын газрын нэр"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? mn.loading : mn.signup}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            {mn.alreadyHaveAccount}{' '}
            <button
              onClick={onToggleMode}
              className="text-green-400 hover:text-green-300 font-medium transition-colors"
              disabled={loading}
            >
              {mn.login}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;