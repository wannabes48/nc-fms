'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export default function StaffLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("That email or password isn't right.");
      setLoading(false);
    } else {
      router.push('/dashboard'); // Route to the main staff dashboard
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      {/* Left Column - Context */}
      <div className="hidden lg:flex w-1/2 bg-[#0F6E56] text-white flex-col justify-between p-12">
        <div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#0F6E56] font-bold text-xl mb-6">
            SDA
          </div>
          <h1 className="text-4xl font-bold mb-4">Nyamira Conference</h1>
          <p className="text-blue-100 text-lg max-w-md">
            Treasury & Financial Management System
          </p>
        </div>
        <div>
          <p className="text-sm text-blue-200">Authorized Personnel Only.</p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center text-sm text-[#6B6A62] hover:text-[#0F6E56] mb-12 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to home
          </Link>

          <div className="mb-8">
            <div className="w-10 h-10 bg-blue-50 text-[#185FA5] rounded-full flex items-center justify-center mb-4 lg:hidden">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-bold text-[#232420] mb-2">Staff Login</h2>
            <p className="text-[#6B6A62]">Access your treasury dashboard.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-[#A32D2D] p-4 rounded-[8px] text-sm mb-6 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#232420] mb-2">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] outline-none transition-all text-[#232420]"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-[#232420]">Password</label>
                <Link href="#" className="text-sm text-[#185FA5] hover:underline">Forgot password?</Link>
              </div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] outline-none transition-all text-[#232420]"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#232420] text-white py-3 rounded-[8px] font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
          
          <p className="text-center text-sm text-[#6B6A62] mt-8">
            Don't have an account? Contact your conference administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
