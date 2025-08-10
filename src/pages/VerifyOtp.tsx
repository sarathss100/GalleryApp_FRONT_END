import React, { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { VerifyCode } from '../services/userApi'; 

// Define form data interface for verification
interface VerificationData {
  code: string[];
}

const Verification: React.FC = () => {
  const [verificationData, setVerificationData] = useState<VerificationData>({
    code: ['', '', '', '', '', ''], // Array for 6 alphanumeric characters
  });
  const [errors, setErrors] = useState<{ api?: string; code?: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Refs for input focus
  const navigate = useNavigate();
  const { email } = useParams<{ email: string }>(); // Get email from URL params

  // Validate form in real-time to enable/disable verify button
  useEffect(() => {
    const isValid = verificationData.code.every(char => char.length === 1 && /^[a-zA-Z0-9]$/.test(char));
    setIsFormValid(isValid);
  }, [verificationData]);

  // Handle input change for each character
  const handleChange = (index: number) => (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.toLowerCase(); // Convert to lowercase to match example (hdi1cp)
    if (/^[a-zA-Z0-9]?$/.test(value)) { // Allow only single alphanumeric character or empty
      setVerificationData(prev => ({
        ...prev,
        code: prev.code.map((char, i) => (i === index ? value : char)),
      }));
      // Move to next input if character is entered
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle backspace to move to previous input
  const handleKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !verificationData.code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste event for the entire code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().toLowerCase();
    if (/^[a-zA-Z0-9]{6}$/.test(pastedData)) { // Validate 6 alphanumeric characters
      const newCode = pastedData.split('');
      setVerificationData({ code: newCode });
      inputRefs.current[5]?.focus();
    } else {
      setErrors({ code: 'Invalid code format. Use 6 alphanumeric characters.' });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();

    if (isFormValid && email) {
      setIsLoading(true);
      try {
        const cacheCode = verificationData.code.join('');
        const response = await VerifyCode(email, cacheCode);

        if (response.success) {
          toast.success('Verification successful! Account created.');
          setVerificationData({ code: ['', '', '', '', '', ''] });
          navigate('/');
        } else {
          const errorData: { message?: string } = await response.json();
          setErrors({ api: errorData.message || 'Verification failed' });
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setErrors({ api: 'An error occurred. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    } else if (!email) {
      setErrors({ api: 'Email is missing from the request.' });
    }
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
            Verify Your Email
          </h2>
          <p className="text-slate-400 text-sm">Enter the 6-character code sent to your email</p>
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
          <div className="flex justify-between gap-3">
            {verificationData.code.map((char, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={char}
                onChange={handleChange(index)}
                onKeyDown={handleKeyDown(index)}
                onPaste={index === 0 ? handlePaste : undefined}
                ref={el => { inputRefs.current[index] = el; }}
                className="w-12 h-12 text-center text-lg font-medium bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm"
                disabled={isLoading}
              />
            ))}
          </div>

          {errors.code && (
            <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.code}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid}
            className={`w-full relative py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:scale-105 focus:outline-none mt-6 ${
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
                {isLoading ? 'Verifying...' : 'Verify'}
              </span>
            </div>
            {!isLoading && !(!isFormValid) && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
            )}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Didn't receive a code?{' '}
            <button 
              onClick={() => navigate('/resend-code')} 
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-300 hover:underline underline-offset-2"
              disabled={isLoading}
            >
              Resend Code
            </button>
          </p>
        </div>

        {/* Bottom glow effect */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-30"></div>
      </div>
    </div>
  );
};

export default Verification;