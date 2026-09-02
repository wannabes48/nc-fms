'use client';
import { useState } from 'react';
import { Landmark } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("That email or password isn't right.");
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Column - Institutional Context (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-black/10 rounded-full blur-3xl -z-0" />
        
        <div className="relative z-10 flex items-center gap-3">
          <Landmark className="h-10 w-10 text-white" />
          <span className="text-2xl font-bold text-white tracking-tight">SDA Nyamira Conference</span>
        </div>
        
        <div className="relative z-10 text-white">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Treasury Management <br /> & Reconciliation
          </h1>
          <p className="text-brand-bg/80 text-lg max-w-md leading-relaxed opacity-90">
            A unified platform for managing local church offerings, district reporting, and conference-wide financial health.
          </p>
          
          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-3xl font-bold">42</p>
              <p className="text-sm opacity-80 mt-1">Active Churches</p>
            </div>
            <div>
              <p className="text-3xl font-bold">6</p>
              <p className="text-sm opacity-80 mt-1">Districts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface">
        <div className="max-w-md w-full">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-12">
            <Landmark className="h-8 w-8 text-brand" />
            <span className="text-xl font-bold text-slate-800 tracking-tight">SDA Nyamira Conference</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign in</h2>
          <p className="text-slate-500 mb-8">Access the conference treasury dashboard</p>

          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg flex items-center">
              <p className="text-danger text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
                placeholder="treasurer@ncfms.org"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-accent hover:text-brand transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand text-white py-3 rounded-lg font-medium hover:bg-brand-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account? <br />
            Contact your conference administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
