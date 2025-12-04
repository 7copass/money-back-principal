import React from 'react';
import type { Company, Transaction, Client, Campaign } from './types';
import { UserRole } from './types';

// Type assertion for Recharts from window
declare global {
  interface Window {
    Recharts: any;
  }
}

// ICONS
export const Icons = {
  Logo: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Menu: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  Dashboard: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
  Users: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Building: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>,
  Logout: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>,
  Cash: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><line x1="3" x2="6" y1="3" y2="6" /><line x1="21" x2="18" y1="3" y2="6" /><line x1="3" x2="6" y1="21" y2="18" /><line x1="21" x2="18" y1="21" y2="18" /></svg>,
  Gift: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect width="20" height="5" x="2" y="7" /><line x1="12" x2="12" y1="22" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>,
  Settings: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.82l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.82l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>,
  Trophy: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
  History: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>,
  PlusCircle: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
  Diamond: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.7 10.3a2.4 2.4 0 0 0 0 3.4l7.5 7.5c.9.9 2.5.9 3.4 0l7.5-7.5a2.4 2.4 0 0 0 0-3.4l-7.5-7.5a2.4 2.4 0 0 0-3.4 0Z" /></svg>,
  Edit: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>,
  Trash: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  Redeem: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  MessageSquare: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  DollarSign: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  ShoppingBag: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
  BarChart2: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Tag: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
  TrendingUp: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  Clock: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Megaphone: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>,
  AlertCircle: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  CheckCircle: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  Bell: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  AlertTriangle: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
};

// UI PRIMITIVES
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md p-4 sm:p-6 ${className}`}>{children}</div>
);

export const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string, type?: 'button' | 'submit' | 'reset', disabled?: boolean }> = ({ children, onClick, className = '', type = 'button', disabled = false }) => (
  <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-lg font-semibold text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}>
    {children}
  </button>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-brand-darkest placeholder:text-gray-400 disabled:bg-gray-100 ${props.className}`} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-brand-darkest placeholder:text-gray-400 ${props.className}`} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-brand-darkest ${props.className}`} />
);

// LOADER COMPONENT
export const Loader: React.FC<{ className?: string, text?: string }> = ({ className = '', text }) => (
  <div className={`flex flex-col justify-center items-center p-8 ${className}`}>
    <div className="loader mb-4"></div>
    {text && <p className="text-gray-500 font-medium animate-pulse">{text}</p>}
  </div>
);


// MODAL COMPONENT
export const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-lg', // Mantendo compatibilidade com o antigo padrão que era max-w-lg visualmente mas sem prop
    'lg': 'max-w-xl',
    'xl': 'max-w-2xl',
    '2xl': 'max-w-3xl',
    '3xl': 'max-w-4xl',
    '4xl': 'max-w-5xl',
    '5xl': 'max-w-6xl',
    'full': 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0" onClick={onClose}></div>
      <Card className={`relative z-50 w-full ${sizeClasses[size]} my-8`}>
        <div className="flex justify-between items-center mb-6">
          <h2 id="modal-title" className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors">&times;</button>
        </div>
        {children}
      </Card>
    </div>
  );
};

// CONFIRMATION MODAL COMPONENT
export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'primary' }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${variant === 'danger'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-brand-primary hover:bg-brand-secondary'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// LAYOUT COMPONENTS
interface SidebarProps {
  userRole: UserRole;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  currentPage: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole, onNavigate, onLogout, currentPage, isOpen, setIsOpen }) => {
  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsOpen(false); // Close sidebar on navigation
  }

  const getNavItems = () => {
    switch (userRole) {
      case UserRole.MANAGER:
        return [
          { label: 'Dashboard', icon: Icons.Dashboard, page: 'dashboard' },
          { label: 'Empresas', icon: Icons.Building, page: 'empresas' },
          { label: 'Usuários', icon: Icons.Users, page: 'usuarios' },
        ];
      case UserRole.ADM:
        return [
          { label: 'Dashboard', icon: Icons.Dashboard, page: 'dashboard' },
          { label: 'WhatsApp', icon: Icons.MessageSquare, page: 'whatsapp' },
          { label: 'Registrar Cashback', icon: Icons.PlusCircle, page: 'registrar' },
          { label: 'Resgatar Cashback', icon: Icons.Redeem, page: 'resgatar' },
          { label: 'Clientes', icon: Icons.Users, page: 'clientes' },
          { label: 'Produtos', icon: Icons.ShoppingBag, page: 'produtos' },
          { label: 'Campanhas', icon: Icons.Megaphone, page: 'campanhas' },
          { label: 'Ranking', icon: Icons.Trophy, page: 'ranking' },
          { label: 'Permissões', icon: Icons.Settings, page: 'permissoes' },
        ];
      case UserRole.SELLER:
        return [
          { label: 'Dashboard', icon: Icons.Dashboard, page: 'dashboard' },
          { label: 'Registrar Cashback', icon: Icons.PlusCircle, page: 'registrar' },
          { label: 'Resgatar Cashback', icon: Icons.Redeem, page: 'resgatar' },
          { label: 'Ranking', icon: Icons.Trophy, page: 'ranking' },
        ];
      case UserRole.USER:
        return [
          { label: 'Meu Saldo', icon: Icons.Cash, page: 'dashboard' },
          { label: 'Histórico', icon: Icons.History, page: 'historico' },
        ];
      default:
        return [];
    }
  };

  const NavItem: React.FC<{ label: string; icon: React.FC<any>; page: string; }> = ({ label, icon: Icon, page }) => {
    const isActive = currentPage === page;
    return (
      <li
        onClick={() => handleNavigate(page)}
        className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-brand-primary text-white' : 'hover:bg-brand-dark/10'}`}
      >
        <Icon className="w-6 h-6 mr-3" />
        <span>{label}</span>
      </li>
    )
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div onClick={() => setIsOpen(false)} className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}></div>

      <aside className={`w-64 bg-white h-screen flex flex-col p-4 shadow-lg fixed top-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center text-brand-primary mb-10 px-3">
          <Icons.Logo />
          <h1 className="text-2xl font-bold ml-2">Moneyback</h1>
        </div>
        <nav className="flex-grow">
          <ul>
            {getNavItems().map(item => <NavItem key={item.page} {...item} />)}
          </ul>
        </nav>
        <div>
          <button onClick={onLogout} className="flex items-center p-3 w-full rounded-lg text-brand-dark hover:bg-red-100 hover:text-red-600 transition-colors">
            <Icons.Logout className="w-6 h-6 mr-3" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export const Header: React.FC<{ title: string, userName: string, onMenuClick: () => void }> = ({ title, userName, onMenuClick }) => (
  <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 p-4 flex justify-between items-center shadow-sm">
    <div className="flex items-center">
      <button onClick={onMenuClick} className="md:hidden mr-4 p-1 text-gray-600">
        <Icons.Menu className="w-6 h-6" />
      </button>
      <h1 className="text-xl sm:text-2xl font-bold text-brand-darkest">{title}</h1>
    </div>
    <div className="flex items-center">
      <span className="hidden sm:inline text-gray-600 mr-4">Olá, {userName}</span>
      <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
        {userName.charAt(0)}
      </div>
    </div>
  </header>
);

// DASHBOARD COMPONENTS
export const StatCard: React.FC<{ title: string; value: string; icon: React.FC<any> }> = ({ title, value, icon: Icon }) => (
  <Card>
    <div className="flex items-center">
      <div className="p-3 bg-brand-primary/10 rounded-full mr-4">
        <Icon className="w-6 h-6 text-brand-primary" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-brand-darkest">{value}</p>
      </div>
    </div>
  </Card>
);

export const CompanyTable: React.FC<{ companies: Company[] }> = ({ companies }) => (
  <Card>
    <h2 className="text-xl font-bold mb-4">Empresas Cadastradas</h2>
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[600px]">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-2 sm:p-4">Empresa</th>
            <th className="p-2 sm:p-4">Plano</th>
            <th className="p-2 sm:p-4">Cashback Gerado</th>
            <th className="p-2 sm:p-4">Clientes Ativos</th>
            <th className="p-2 sm:p-4">Taxa de Conversão</th>
          </tr>
        </thead>
        <tbody>
          {companies.map(c => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="p-2 sm:p-4 font-semibold">{c.name}</td>
              <td className="p-2 sm:p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.plan === 'Premium' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{c.plan}</span></td>
              <td className="p-2 sm:p-4">{c.totalCashbackGenerated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              <td className="p-2 sm:p-4">{c.activeClients}</td>
              <td className="p-2 sm:p-4">{c.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

export const SalesChart: React.FC<{ data: Company['monthlySales'] }> = ({ data }) => {
  if (!window.Recharts) {
    return (
      <Card>
        <h2 className="text-xl font-bold mb-4">Vendas Mensais</h2>
        <div style={{ width: '100%', height: 300 }} className="flex items-center justify-center">
          <p className="text-gray-500">Carregando gráfico...</p>
        </div>
      </Card>
    );
  }

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts;

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Vendas Mensais</h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            <Legend />
            <Line type="monotone" dataKey="sales" name="Vendas" stroke="#C07520" strokeWidth={2} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const ClientRanking: React.FC<{ clients: Client[] }> = ({ clients }) => {
  const tierColor = (tier: Client['status']) => {
    switch (tier) {
      case 'Diamante': return 'text-cyan-500';
      case 'Platina': return 'text-gray-500';
      case 'Ouro': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  }
  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Ranking de Clientes</h2>
      <ul>
        {clients.sort((a, b) => b.points - a.points).slice(0, 5).map((client, index) => (
          <li key={client.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
            <div className="flex items-center">
              <span className="text-lg font-bold text-brand-tertiary mr-4">{index + 1}</span>
              <div>
                <p className="font-semibold">{client.name}</p>
                <p className="text-sm text-gray-500">{client.points} PTS</p>
              </div>
            </div>
            <div className={`flex items-center font-bold ${tierColor(client.status)}`}>
              <Icons.Diamond className="w-5 h-5 mr-1" />
              <span>{client.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const TransactionHistory: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const statusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'Disponível': return 'bg-success/10 text-success';
      case 'Resgatado': return 'bg-blue-100 text-blue-800';
      case 'Vencido': return 'bg-danger/10 text-danger';
    }
  }
  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Histórico de Transações</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2 sm:p-4">Produto/Serviço</th>
              <th className="p-2 sm:p-4">Valor Compra</th>
              <th className="p-2 sm:p-4">Cashback</th>
              <th className="p-2 sm:p-4">Data</th>
              <th className="p-2 sm:p-4">Expiração</th>
              <th className="p-2 sm:p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="p-2 sm:p-4 font-semibold">{t.product}</td>
                <td className="p-2 sm:p-4">{t.purchaseValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className={`p-2 sm:p-4 font-bold ${t.cashbackValue < 0 ? 'text-danger' : 'text-success'}`}>{t.cashbackValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                {/* FIX: Corrected typo from toLocaleDateDateString to toLocaleDateString */}
                <td className="p-2 sm:p-4">{new Date(t.purchaseDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td className="p-2 sm:p-4">{new Date(t.cashbackExpirationDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td className="p-2 sm:p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor(t.status)}`}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export const CampaignCard: React.FC<{ campaign: Campaign; onEdit: (campaign: Campaign) => void; onDelete: (campaign: Campaign) => void; }> = ({ campaign, onEdit, onDelete }) => {
  const statusClasses: Record<Campaign['status'], string> = {
    'Ativa': 'bg-success/10 text-success',
    'Agendada': 'bg-yellow-100 text-yellow-800',
    'Finalizada': 'bg-gray-100 text-gray-600',
  };

  return (
    <Card className="flex flex-col">
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-brand-primary">{campaign.name}</h3>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[campaign.status]}`}>{campaign.status}</span>
        </div>
        <p className="text-gray-600 mt-2">{campaign.description}</p>
        <div className="mt-4 text-sm text-gray-500">
          <p><strong>Período:</strong> {new Date(campaign.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {new Date(campaign.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
          <p><strong>Multiplicador:</strong> {campaign.multiplier}x</p>
          <p><strong>Compra Mínima:</strong> {campaign.minPurchaseValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => onEdit(campaign)} className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300 flex-1 inline-flex items-center justify-center">
          <Icons.Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
        <button onClick={() => onDelete(campaign)} className="p-2 text-danger hover:bg-danger/10 rounded-lg">
          <Icons.Trash className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
};

export const Podium: React.FC<{
  title: string;
  subtitle: string;
  data: { id: string; name: string; value: number | string; subValue: string; }[];
  valueFormatter: (value: number | string) => string;
}> = ({ title, subtitle, data, valueFormatter }) => {

  const podiumConfig = [
    { rank: 2, color: 'text-gray-400', borderColor: 'border-gray-300', height: 'h-32' },
    { rank: 1, color: 'text-yellow-500', borderColor: 'border-brand-primary', height: 'h-48' },
    { rank: 3, color: 'text-amber-700', borderColor: 'border-amber-600', height: 'h-24' },
  ];

  const top3 = data.slice(0, 3);

  const podiumData = [
    top3.length > 1 ? { ...top3[1], ...podiumConfig[0] } : null,
    top3.length > 0 ? { ...top3[0], ...podiumConfig[1] } : null,
    top3.length > 2 ? { ...top3[2], ...podiumConfig[2] } : null,
  ];

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  }

  return (
    <div className="bg-brand-darkest text-white rounded-xl shadow-2xl p-6 sm:p-8 w-full">
      <div className="text-center mb-8">
        <Icons.Trophy className="w-10 h-10 mx-auto text-brand-primary mb-2" />
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="text-gray-300">{subtitle}</p>
      </div>
      <div className="flex justify-center items-end gap-2 sm:gap-4">
        {podiumData.map((item) => item && (
          <div key={item.id} className={`flex flex-col items-center ${item.rank === 1 ? 'w-1/3 max-w-xs z-10' : 'w-1/3 max-w-[240px]'}`}>
            <div className={`relative w-full p-4 text-center bg-brand-dark rounded-t-lg border-2 ${item.borderColor} shadow-lg`}>
              <Icons.Trophy className={`w-8 h-8 absolute -top-5 left-1/2 -translate-x-1/2 ${item.color}`} />
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-primary flex items-center justify-center mx-auto mb-3 font-bold text-2xl border-4 border-brand-darkest">
                {getInitials(item.name)}
              </div>
              <h3 className="font-bold sm:text-lg whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</h3>
              <p className={`font-bold text-xl sm:text-2xl ${item.color}`}>{valueFormatter(item.value)}</p>
              <p className="text-xs sm:text-sm text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">{item.subValue}</p>
            </div>
            <div className={`w-full ${item.height} bg-brand-primary/80 rounded-b-lg flex items-center justify-center text-5xl font-extrabold opacity-80`}>
              {item.rank}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};