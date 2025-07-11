import React, { useState } from 'react';
import { Car, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { mn } from '../../utils/mongolian';
import { useAuth } from '../../contexts/AuthContext';

interface ForgotPasswordFormProps {
  onToggleMode: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form data
      if (!email.trim()) {
        setError('И-мэйл хаягаа оруулна уу');
        setLoading(false);
        return;
      }

      const resetSuccess = await resetPassword(email.trim());
      
      if (resetSuccess) {
        setSuccess(true);
        setEmail('');
      } else {
        setError('И-мэйл илгээхэд алдаа гарлаа. И-мэйл хаягаа шалгаад дахин оролдоно уу.');
      }
    } catch (err) {
      console.error('ForgotPasswordForm: Reset password error:', err);
      setError('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center px-6">
        <div className="max-w-sm mx-auto w-full text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">И-мэйл илгээгдлээ!</h3>
          <p className="text-gray-400 mb-6">
            Нууц үг сэргээх заавар таны и-мэйл хаяг руу илгээгдлээ. И-мэйлээ шалгаад заавраар дагуу нууц үгээ шинэчлэнэ үү.
          </p>
          <button
            onClick={onToggleMode}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Нэвтрэх хуудас руу буцах</span>
          </button>
        </div>
      </div>
    );
  }

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
          <h3 className="text-xl font-bold text-white mb-2">Нууц үг сэргээх</h3>
          <p className="text-gray-400">И-мэйл хаягаа оруулбал нууц үг сэргээх заавар илгээх болно</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {mn.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
              placeholder="И-мэйл хаягаа оруулна уу"
              required
              autoComplete="email"
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
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Mail size={20} />
                <span>Нууц үг сэргээх и-мэйл илгээх</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={onToggleMode}
            className="text-green-400 hover:text-green-300 font-medium transition-colors flex items-center justify-center space-x-2 mx-auto"
            disabled={loading}
          >
            <ArrowLeft size={16} />
            <span>Нэвтрэх хуудас руу буцах</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;