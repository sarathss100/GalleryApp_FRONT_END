import React from 'react';
import { useAuthStore } from '../stores/userAuthStore'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Header: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        useAuthStore.getState().logout()
        navigate('/signin')
        toast.success("logout successfull !!")
    };

    return (
        <header className="w-full bg-gradient-to-br from-slate-800/90 via-gray-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl border-b border-slate-700/50 relative">
            {/* Glowing top border */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full opacity-60"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
                {/* App Name (Left Side) */}
                <div className="flex items-center">
                    <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text tracking-tight">
                        <a 
                            href="/" 
                            className="hover:from-emerald-400 hover:to-teal-400 transition-all duration-300 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text"
                        >
                            Gallery
                        </a>
                    </h1>
                </div>

                {/* Logout Button (Right Side) */}
                <div className="flex items-center">
                    <button
                        onClick={handleLogout}
                        className="group relative text-slate-400 hover:text-emerald-300 transition-all duration-300 p-3 rounded-xl hover:bg-slate-700/50 transform hover:scale-105"
                        title="Log Out"
                    >
                        <svg className="w-6 h-6 transition-all duration-300 group-hover:rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                        
                        {/* Hover effect background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                </div>
            </div>
            
            {/* Bottom subtle glow */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent rounded-full"></div>
        </header>
    );
};

export default Header;