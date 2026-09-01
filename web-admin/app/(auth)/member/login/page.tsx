'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MemberLogin() {
  const [step, setStep] = useState<'phone' | 'otp' | 'names' | 'church_select'>('phone');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const router = useRouter();

  // Form data for church selection
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedChurch, setSelectedChurch] = useState('');

  // Dynamic data states
  const [stations, setStations] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [churches, setChurches] = useState<any[]>([]);

  // Fetch Stations when user reaches the church_select step
  useEffect(() => {
    if (step === 'church_select') {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stations/`)
        .then(res => res.json())
        .then(data => setStations(data.results || data))
        .catch(err => console.error("Error fetching stations:", err));
    }
  }, [step]);

  // Fetch Districts when a Station is selected
  useEffect(() => {
    if (selectedStation) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/districts/?station_id=${selectedStation}`)
        .then(res => res.json())
        .then(data => setDistricts(data.results || data));
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedStation]);

  // Fetch Churches when a District is selected
  useEffect(() => {
    if (selectedDistrict) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/churches/?district_id=${selectedDistrict}`)
        .then(res => res.json())
        .then(data => setChurches(data.results || data));
    } else {
      setChurches([]);
      setSelectedChurch('');
    }
  }, [selectedDistrict]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/request-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone })
      });
      setStep('otp');
    } catch (error) {
      console.error('Failed to request OTP', error);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, otp })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Save the token securely in the browser
        localStorage.setItem('token', data.token);
        
        // Check if user already has a name; if not, go to 'names' step
        setStep('names');
      } else {
        alert("Invalid OTP");
      }
    } catch (error) {
      console.error('Failed to verify OTP', error);
    }
  };

  const handleSaveChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/update-profile/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ local_church_id: selectedChurch })
      });
      router.push('/member/dashboard');
    } catch (error) {
      console.error('Failed to save church', error);
    }
  };

  const handleSaveNames = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // Save names to Django profile backend
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/update-profile/`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName })
    });

    setStep('church_select');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[12px] p-8 shadow-sm border border-[#E4E1D8]">
        {step !== 'church_select' && (
          <Link href="/" className="inline-flex items-center text-sm text-[#6B6A62] hover:text-[#0F6E56] mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to home
          </Link>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <h1 className="text-2xl font-bold text-[#232420] mb-2">Welcome back</h1>
            <p className="text-[#6B6A62] text-sm mb-6">Enter your phone number to securely access your giving account.</p>
            
            <div>
              <label className="block text-sm font-medium text-[#232420] mb-2">Phone Number</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-[#6B6A62]">+254</span>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="712 345 678"
                  className="w-full pl-14 pr-4 py-3 rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] outline-none text-[#232420]"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#0F6E56] text-white py-3 rounded-[8px] font-medium hover:bg-[#085041]">Send code</button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <h1 className="text-2xl font-bold text-[#232420] mb-2">Verify your number</h1>
            <p className="text-[#6B6A62] text-sm mb-6">We sent a 4-digit code to {phone}.</p>
            
            <div>
              <label className="block text-sm font-medium text-[#232420] mb-2">4-Digit Code</label>
              <input 
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="• • • •"
                className="w-full px-4 py-3 text-center tracking-[1em] font-mono text-xl rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] outline-none text-[#232420]"
                required
              />
            </div>
            <button type="submit" className="w-full bg-[#0F6E56] text-white py-3 rounded-[8px] font-medium hover:bg-[#085041]">Verify & Log In</button>
          </form>
        )}

        {step === 'names' && (
          <form onSubmit={handleSaveNames} className="space-y-6">
            <h1 className="text-2xl font-bold text-[#232420] mb-2">What is your name?</h1>
            <p className="text-[#6B6A62] text-sm mb-6">This will be used for your giving records and receipts.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#232420] mb-2">First Name</label>
                <input 
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Daniel"
                  className="w-full px-4 py-3 rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] outline-none text-[#232420]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#232420] mb-2">Last Name</label>
                <input 
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Siro"
                  className="w-full px-4 py-3 rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] outline-none text-[#232420]"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#0F6E56] text-white py-3 rounded-[8px] font-medium hover:bg-[#085041]">Continue</button>
          </form>
        )}

        {step === 'church_select' && (
          <form onSubmit={handleSaveChurch} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-50 text-[#0F6E56] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-[#232420] mb-2">Phone Verified</h1>
              <p className="text-[#6B6A62] text-sm">Where do you return your tithe and offerings?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#232420] mb-2">Station</label>
                <select 
                  value={selectedStation} 
                  onChange={(e) => { setSelectedStation(e.target.value); setSelectedDistrict(''); setSelectedChurch(''); }}
                  className="w-full px-4 py-3 rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] outline-none text-[#232420]" required
                >
                  <option value="">Select Station</option>
                  {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {selectedStation && (
                <div>
                  <label className="block text-sm font-medium text-[#232420] mb-2">District</label>
                  <select 
                    value={selectedDistrict} 
                    onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedChurch(''); }}
                    className="w-full px-4 py-3 rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] outline-none text-[#232420]" required
                    disabled={districts.length === 0}
                  >
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}

              {selectedDistrict && (
                <div>
                  <label className="block text-sm font-medium text-[#232420] mb-2">Local Church</label>
                  <select 
                    value={selectedChurch} 
                    onChange={(e) => setSelectedChurch(e.target.value)}
                    className="w-full px-4 py-3 rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] outline-none text-[#232420]" required
                    disabled={churches.length === 0}
                  >
                    <option value="">Select Church</option>
                    {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={!selectedChurch}
              className="w-full bg-[#0F6E56] text-white py-3 rounded-[8px] font-medium hover:bg-[#085041] transition-colors disabled:opacity-50"
            >
              Continue to Dashboard
            </button>
          </form>
        )}
        
        {step !== 'church_select' && (
          <div className="mt-8 pt-6 border-t border-[#E4E1D8] flex items-center justify-center gap-2 text-[#6B6A62] text-xs">
            <ShieldCheck className="w-4 h-4 text-[#0F6E56]" />
            Secured by enterprise-grade encryption
          </div>
        )}
      </div>
    </div>
  );
}
