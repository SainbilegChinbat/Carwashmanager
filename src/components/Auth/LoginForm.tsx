import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Car } from 'lucide-react';
import { mn } from '../../utils/mongolian';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('carwash_remembered_email');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('LoginForm: Submitting login form with email:', formData.email);
      
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

      const result = await login(formData.email.trim(), formData.password);
      
      if (result.success) {
        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('carwash_remembered_email', formData.email.trim());
        } else {
          localStorage.removeItem('carwash_remembered_email');
        }
      } else {
        // Provide more specific error messages based on the error type
        if (result.error?.includes('Invalid login credentials') || result.error?.includes('invalid_credentials')) {
          setError('И-мэйл хаяг эсвэл нууц үг буруу байна. Дахин оролдоно уу.');
        } else if (result.error?.includes('Email not confirmed')) {
          setError('И-мэйл хаягаа баталгаажуулна уу.');
        } else if (result.error?.includes('Too many requests')) {
          setError('Хэт олон удаа оролдлоо. Хэсэг хүлээгээд дахин оролдоно уу.');
        } else {
          setError(result.error || 'Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.');
        }
      }
    } catch (err) {
      console.error('LoginForm: Login error:', err);
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
          <h3 className="text-xl font-bold text-white mb-2">{mn.welcomeBack}</h3>
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
              autoComplete="email"
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
                autoComplete="current-password"
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

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                  disabled={loading}
                />
                <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                  rememberMe 
                    ? 'bg-green-500 border-green-500' 
                    : 'bg-transparent border-gray-600 hover:border-gray-500'
                }`}>
                  {rememberMe && (
                    <svg 
                      className="w-3 h-3 text-white absolute top-0.5 left-0.5" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-gray-300 text-sm select-none">Намайг сана</span>
            </label>

            <button 
              type="button" 
              onClick={onForgotPassword}
              className="text-yellow-400 text-sm hover:text-yellow-300 transition-colors"
              disabled={loading}
            >
              {mn.forgotPassword}
            </button>
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
            {loading ? mn.loading : mn.login}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            {mn.dontHaveAccount}{' '}
            <button
              onClick={onToggleMode}
              className="text-green-400 hover:text-green-300 font-medium transition-colors"
              disabled={loading}
            >
              {mn.signup}
            </button>
          </p>
        </div>

        {/* Help text for users */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Анхны удаа ашиглаж байна уу? Эхлээд бүртгүүлнэ үү.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;