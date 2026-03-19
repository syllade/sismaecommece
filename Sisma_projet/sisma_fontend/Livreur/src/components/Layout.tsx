import { ReactNode } from 'react';
import { Home, User } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: 'dashboard' | 'profile';
  onNavigate: (page: 'dashboard' | 'profile') => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {children}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden shadow-lg">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              currentPage === 'dashboard'
                ? 'text-[#D81918]'
                : 'text-gray-500'
            }`}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Accueil</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              currentPage === 'profile'
                ? 'text-[#D81918]'
                : 'text-gray-500'
            }`}
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Profil</span>
          </button>
        </div>
      </nav>

      <div className="hidden md:block fixed top-6 right-6 z-50">
        <div className="flex gap-2 bg-white rounded-lg shadow-lg p-2">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentPage === 'dashboard'
                ? 'bg-gradient-to-r from-[#D81918] to-[#F7941D] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Accueil</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentPage === 'profile'
                ? 'bg-gradient-to-r from-[#D81918] to-[#F7941D] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
}
