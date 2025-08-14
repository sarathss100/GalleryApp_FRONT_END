import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { SignIn } from '../services/userApi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import SigninFormSchema from '../schemas/SigninFormSchema.ts';

// Define form data interface for login
interface FormData {
  email: string;
  password: string;
}

// Define errors interface for form validation
interface FormErrors {
  email?: string;
  password?: string;
  api?: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const navigate = useNavigate();

  // Validate form in real-time to enable/disable login button
  useEffect(() => {
    const validateFormForButton = (): boolean => {
      if (!formData.email.trim()) return false;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
      if (!formData.password) return false;
      if (formData.password.length < 8) return false;
      return true;
    };
    setIsFormValid(validateFormForButton());
  }, [formData]);

  const validateForm = (): boolean => {
    const result = SigninFormSchema.safeParse(formData); 

        if (!result.success) {
            if (errors) {
                const fieldErrors: Record<string, string> = {};
                result.error.issues.forEach((err) => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(fieldErrors);
            }
            return false;
        }

      if (errors) {
          setErrors({});
      }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await SignIn({
          email: formData.email,
          password: formData.password
        });
        
        if (response.success) {
          toast.success('Login successful!');
          setFormData({
            email: '',
            password: ''
          });
          navigate('/');
        } else {
          const errorData: { message?: string } = await response.json();
          setErrors({ api: errorData.message || 'Login failed' });
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setErrors({ api: 'An error occurred. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative bg-gradient-to-br from-slate-800/90 via-gray-800/90 to-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 hover:shadow-emerald-500/10 hover:shadow-2xl border border-slate-700/50">
        {/* Glowing top border */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"></div>
        
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text tracking-tight mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm">Sign in to continue your journey</p>
        </div>
        
        {errors.api && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-3 backdrop-blur-sm">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm">{errors.api}</span>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="group">
            <label htmlFor="email" className="block text-sm font-semibold text-emerald-300 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors duration-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm"
                placeholder="Enter your email address"
                disabled={isLoading}
              />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>
          
          <div className="group">
            <label htmlFor="password" className="block text-sm font-semibold text-emerald-300 mb-2">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors duration-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.password}
              </p>
            )}
            <div className="mt-3 text-right">
              <button 
                onClick={handleForgotPassword} 
                className="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-300 hover:underline underline-offset-2" 
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            className={`w-full relative py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:scale-105 focus:outline-none ${
              !isFormValid || isLoading 
                ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
            }`}
            disabled={!isFormValid || isLoading}
          >
            <div className="flex items-center justify-center gap-3">
              {isLoading && (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              <span className="text-lg">{isLoading ? 'Signing in...' : 'Sign In'}</span>
            </div>
            {!isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
            )}
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            New to our platform?{' '}
            <button 
              onClick={handleSignUp} 
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-300 hover:underline underline-offset-2" 
              disabled={isLoading}
            >
              Create an account
            </button>
          </p>
        </div>

        {/* Bottom glow effect */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-30"></div>
      </div>
    </div>
  );
};

export default Login;