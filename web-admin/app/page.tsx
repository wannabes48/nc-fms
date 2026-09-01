import Link from 'next/link';
import { HeartHandshake, ShieldCheck, PieChart, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      {/* Header */}
      <header className="bg-[#0F6E56] text-white py-4 px-6 md:px-12 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#0F6E56] font-bold text-xl">
            SDA
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Nyamira Conference</h1>
            <p className="text-xs text-[#E4E1D8]">Financial Management System</p>
          </div>
        </div>
        <div className="hidden md:flex gap-6">
          {/* Updated routing targets */}
          <Link href="/member/login" className="text-sm font-medium hover:text-[#E4E1D8] transition">Give Online</Link>
          <Link href="/staff/login" className="text-sm font-medium hover:text-[#E4E1D8] transition">Staff Portal</Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-24">
        <h2 className="text-4xl md:text-5xl font-bold text-[#232420] tracking-tight max-w-4xl mb-6">
          Faithful Stewardship, <span className="text-[#0F6E56]">Simplified.</span>
        </h2>
        <p className="text-lg text-[#6B6A62] max-w-2xl mb-12">
          A secure, transparent platform for returning your tithes and offerings, and managing our local church finances.
        </p>

        {/* Action Cards Container */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl text-left">
          
          {/* Member Card */}
          <div className="bg-white p-8 rounded-[12px] shadow-sm border border-[#E4E1D8] flex flex-col h-full">
            <div className="w-12 h-12 bg-[#FAF9F6] text-[#0F6E56] rounded-full flex items-center justify-center mb-6 border border-[#E4E1D8]">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#232420] mb-2">For Members</h3>
            <p className="text-[#6B6A62] mb-8 flex-1 text-sm leading-relaxed">
              Log in with your phone number to securely return your tithe, support local church budgets, and download your personal giving history.
            </p>
            {/* Directs to Member Portal */}
            <Link 
              href="/member/login" 
              className="inline-flex items-center justify-center gap-2 bg-[#0F6E56] text-white px-6 py-3 rounded-[8px] font-medium hover:bg-[#085041] transition-colors"
            >
              Give Online <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Staff/Treasurer Card */}
          <div className="bg-white p-8 rounded-[12px] shadow-sm border border-[#E4E1D8] flex flex-col h-full">
            <div className="w-12 h-12 bg-[#FAF9F6] text-[#185FA5] rounded-full flex items-center justify-center mb-6 border border-[#E4E1D8]">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#232420] mb-2">For Treasurers</h3>
            <p className="text-[#6B6A62] mb-8 flex-1 text-sm leading-relaxed">
              Access real-time financial dashboards, manage offering categories, and download automated reconciliation reports for your jurisdiction.
            </p>
            {/* Directs to Staff Portal */}
            <Link 
              href="/staff/login" 
              className="inline-flex items-center justify-center gap-2 bg-white text-[#232420] border border-[#E4E1D8] px-6 py-3 rounded-[8px] font-medium hover:bg-[#FAF9F6] transition-colors"
            >
              Access Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        <div className="mt-16 flex items-center gap-2 text-[#6B6A62] text-sm">
          <ShieldCheck className="w-5 h-5 text-[#0F6E56]" />
          <span>Secured by enterprise-grade encryption and powered by Paystack</span>
        </div>
      </main>
    </div>
  );
}