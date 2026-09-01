'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans">
      {/* Member Top Navigation */}
      <header className="bg-white border-b border-[#E4E1D8] h-16 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-10">
        <Link href="/member/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-[#0F6E56] rounded-full flex items-center justify-center text-white font-bold text-sm">
            SDA
          </div>
          <span className="font-semibold text-[#232420] hidden sm:block">Nyamira Conference</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link href="/member/profile" className="text-[#6B6A62] hover:text-[#0F6E56] p-2 transition-colors">
            <User className="w-5 h-5" />
          </Link>
          <button 
            onClick={handleLogout}
            className="text-[#A32D2D] hover:bg-red-50 p-2 rounded-full transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Member Content Area */}
      <main className="flex-1 flex justify-center p-4 md:p-8 overflow-auto">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}
