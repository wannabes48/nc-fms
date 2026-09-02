'use client';
import { useState, useEffect } from 'react';
import { User, Church, Phone, LogOut, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ firstName: string; lastName: string; church: string; phone: string } | null>(null);
  
  // Modal States for Church Transfer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stations, setStations] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [churches, setChurches] = useState<any[]>([]);

  const [selectedStation, setSelectedStation] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedChurch, setSelectedChurch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Fetch current profile details
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile/`, {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfile({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          church: data.local_church_name || 'Not assigned',
          phone: data.phone_number || ''
        });
      });
  }, []);

  // Fetch stations when modal opens
  const openChurchModal = () => {
    setIsModalOpen(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stations/`)
      .then(res => res.json())
      .then(data => setStations(data.results || data));
  };

  // Fetch districts when station changes
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

  // Fetch churches when district changes
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

  const handleChurchUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/update-church/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ local_church_id: selectedChurch })
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, church: data.church_name } : null);
        setIsModalOpen(false);
      } else {
        console.error('Failed to update church');
      }
    } catch (error) {
      console.error('Error updating church', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="space-y-6">
      <Link href="/member/dashboard" className="inline-flex items-center text-sm text-[#6B6A62] hover:text-[#0F6E56] transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-[#232420]">Profile Settings</h1>

      <div className="bg-white rounded-[12px] shadow-sm border border-[#E4E1D8] p-6 md:p-8 space-y-8">
        <div>
          <h2 className="text-sm font-bold text-[#6B6A62] uppercase tracking-wider mb-4">Account Details</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-[#E4E1D8] pb-4">
              <div className="w-10 h-10 bg-[#FAF9F6] rounded-full flex items-center justify-center text-[#6B6A62]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-[#6B6A62]">Full Name</div>
                <div className="font-semibold text-[#232420]">{profile ? `${profile.firstName} ${profile.lastName}` : 'Loading...'}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 border-b border-[#E4E1D8] pb-4">
              <div className="w-10 h-10 bg-[#FAF9F6] rounded-full flex items-center justify-center text-[#6B6A62]">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#6B6A62]">Phone Number</div>
                <div className="font-semibold text-[#232420]">{profile?.phone || 'Loading...'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-[#E4E1D8] pb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FAF9F6] rounded-full flex items-center justify-center text-[#6B6A62]">
                  <Church className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-[#6B6A62]">Local Church</div>
                  <div className="font-semibold text-[#232420]">{profile?.church || 'Loading...'}</div>
                </div>
              </div>
              <button onClick={openChurchModal} className="text-sm text-[#185FA5] font-medium hover:underline">
                Transfer Branch
              </button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#6B6A62] uppercase tracking-wider mb-4">Actions</h2>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] bg-red-50 text-[#A32D2D] font-medium hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Transfer Church Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[12px] max-w-md w-full p-6 shadow-lg border border-[#E4E1D8]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#232420]">Transfer Local Church</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B6A62] hover:text-[#232420]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChurchUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#232420] mb-2">Station</label>
                <CustomSelect 
                  value={selectedStation} 
                  onChange={(val) => { setSelectedStation(val); setSelectedDistrict(''); setSelectedChurch(''); }}
                  placeholder="Select Station"
                  options={stations.map(s => ({ value: String(s.id), label: s.name }))}
                />
              </div>

              {selectedStation && (
                <div>
                  <label className="block text-sm font-medium text-[#232420] mb-2">District</label>
                  <CustomSelect 
                    value={selectedDistrict} 
                    onChange={(val) => { setSelectedDistrict(val); setSelectedChurch(''); }}
                    placeholder="Select District"
                    options={districts.map(d => ({ value: String(d.id), label: d.name }))}
                  />
                </div>
              )}

              {selectedDistrict && (
                <div>
                  <label className="block text-sm font-medium text-[#232420] mb-2">Local Church</label>
                  <CustomSelect 
                    value={selectedChurch} 
                    onChange={(val) => setSelectedChurch(val)}
                    placeholder="Select Church"
                    options={churches.map(c => ({ value: String(c.id), label: c.name }))}
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-[#E4E1D8] py-3 rounded-[8px] text-sm font-medium hover:bg-[#FAF9F6] text-[#232420]">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!selectedChurch || isSubmitting}
                  className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-[8px] text-sm font-medium transition-colors ${
                    (!selectedChurch || isSubmitting) ? 'bg-[#A5D6A7] text-white cursor-not-allowed' : 'bg-[#0F6E56] text-white hover:bg-[#085041]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
