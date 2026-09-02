'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, FileSpreadsheet, Wallet, Users, Church, LogOut, ShieldAlert } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import Image from 'next/image';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/staff/login');
    },
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-[#6B6A62] text-sm animate-pulse">Loading secure session...</p>
      </div>
    );
  }

  // Extract user role and scoping details from NextAuth session
  const userRole = session?.user?.role; // 'CONFERENCE_ADMIN' or 'LOCAL_CLERK'
  const scopeName = session?.user?.church || session?.user?.role || 'Nyamira Conference';

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: FileSpreadsheet },
    { name: 'Fund Categories', href: '/funds', icon: Wallet, adminOnly: true },
    { name: 'Organization', href: '/organization', icon: Church, adminOnly: true },
    { name: 'Users', href: '/users', icon: Users, adminOnly: true },
  ];

  return (
    <div className="flex h-screen bg-[#FAF9F6] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F6E56] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <Image src="/logo.png" alt="CFMS Logo" width={120} height={40} priority />
          <h2 className="text-xl font-bold tracking-tight">SDA Nyamira Conference</h2>
          <p className="text-xs text-blue-200 mt-1">Treasury Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // Hide admin-only items if the user is a Local Clerk
            if (item.adminOnly && userRole !== 'CONFERENCE_ADMIN') return null;
            
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-blue-200 font-medium truncate">{session?.user?.name || 'Staff Member'}</p>
            <p className="text-[10px] text-slate-300 uppercase tracking-wider">{userRole?.replace('_', ' ')}</p>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/staff/login' })}
            className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-200 hover:bg-white/10 rounded-[8px] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar with RBAC Scope Badge */}
        <header className="h-16 bg-white border-b border-[#E4E1D8] flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-[#232420]">
              {navItems.find(i => pathname.startsWith(i.href))?.name || 'Dashboard'}
            </h1>
            {/* Visual Scope Confirmation */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 text-[#0F6E56] text-xs font-semibold rounded-full border border-green-200">
              <span className="w-2 h-2 rounded-full bg-[#0F6E56]"></span>
              Viewing: {scopeName}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <div className="text-xs text-[#6B6A62] bg-[#FAF9F6] px-3 py-1.5 rounded-[8px] border border-[#E4E1D8]">
              Secure Staff Session
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
