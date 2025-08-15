import React, { useState, useEffect, type FormEvent, type ChangeEvent, useCallback } from 'react';
import { forgotPassword } from '../services/userApi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ResetPasswordFormSchema from '../schemas/ResetPasswordFormSchema';

// Define form data interface
interface FormData {
  email: string;
}

// Define errors interface for form validation
interface FormErrors {
  email?: string;
  api?: string;
}

interface TouchedFields {
  email: boolean;
}

const ForgotPassword: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    email: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [hasSubmitAttempt, setHasSubmitAttempt] = useState<boolean>(false);
  const navigate = useNavigate();

  const validateForm = useCallback((showErrors: boolean = false): boolean => {
    const result = ResetPasswordFormSchema.safeParse(formData); 

    if (!result.success) {
      if (showErrors) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(prev => ({ ...prev, ...fieldErrors }));
      }
      return false;
    }

    if (showErrors) {
      // Clear field errors but keep API errors
      setErrors(prev => ({ api: prev.api }));
    }

    return true;
  }, [formData]);

  // Only validate for form validity (not showing errors)
  useEffect(() => {
    const isValid = validateForm(false);
    setIsFormValid(isValid);
  }, [formData, validateForm]);

  // Show errors only for touched fields or after submit attempt
  useEffect(() => {
    if (hasSubmitAttempt || touchedFields.email) {
      validateForm(true);
    }
  }, [formData, touchedFields, hasSubmitAttempt, validateForm]);

  const handleSubmit = async (e: FormEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    
    // Mark that a submit attempt has been made
    setHasSubmitAttempt(true);
    
    // Mark field as touched on submit attempt
    setTouchedFields({
      email: true
    });

    if (validateForm(true)) {
      setIsLoading(true);
      try {
        const response = await forgotPassword(formData.email);
        
        if (response.success) {
          toast.success(response.message);
          navigate(`/reset-password/${formData.email}`);
          setFormData({ email: '' });
          setTouchedFields({ email: false });
          setHasSubmitAttempt(false);
        } 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setErrors(prev => ({ ...prev, api: 'An error occurred. Please try again.' }));
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
    
    // Clear API errors when user starts typing
    if (errors.api) {
      setErrors(prev => ({ ...prev, api: undefined }));
    }
  };

  const handleBlur = (fieldName: keyof TouchedFields) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  // Only show field errors if the field has been touched or submit was attempted
  const shouldShowFieldError = (fieldName: keyof TouchedFields): boolean => {
    return touchedFields[fieldName] || hasSubmitAttempt;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative bg-gradient-to-br from-slate-800/90 via-gray-800/90 to-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 hover:shadow-emerald-500/10 hover:shadow-2xl border border-slate-700/50">
        {/* Glowing top border */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"></div>
        
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text tracking-tight mb-2">
            Reset Your Password
          </h2>
          <p className="text-slate-400 text-sm">Enter your email to receive a reset code</p>
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
                onBlur={() => handleBlur('email')}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm"
                placeholder="Enter your email address"
                disabled={isLoading}
              />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
            </div>
            {errors.email && shouldShowFieldError('email') && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid}
            className={`w-full relative py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:scale-105 focus:outline-none ${
              isLoading || !isFormValid 
                ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              {isLoading && (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              <span className="text-lg">
                {isLoading ? 'Processing...' : 'Send Reset Code'}
              </span>
            </div>
            {!isLoading && !(!isFormValid) && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
            )}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Remember your password?{' '}
            <button 
              onClick={() => navigate('/signin')} 
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-300 hover:underline underline-offset-2"
              disabled={isLoading}
            >
              Log in
            </button>
          </p>
        </div>

        {/* Bottom glow effect */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-30"></div>
      </div>
    </div>
  );
};

export default ForgotPassword;