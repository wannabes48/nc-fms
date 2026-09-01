'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Edit2, X, Church, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChurchesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [churches, setChurches] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedStation, setSelectedStation] = useState('');
  const [formData, setFormData] = useState({ name: '', district: '', is_active: true });

  useEffect(() => {
    if (session?.user?.role && session.user.role !== 'CONFERENCE_ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchChurches();
    fetchStations();
  }, [session, router]);

  // Fetch dynamic districts when station is selected in the modal
  useEffect(() => {
    if (selectedStation) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/districts/?station_id=${selectedStation}`)
        .then(res => res.json())
        .then(data => setDistricts(data.results || data));
    } else {
      setDistricts([]);
    }
  }, [selectedStation]);

  const fetchChurches = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/churches/`);
      const data = await res.json();
      setChurches(data.results || data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stations/`);
    const data = await res.json();
    setStations(data.results || data);
  };

  const handleOpenModal = (church: any = null) => {
    if (church) {
      setEditingId(church.id);
      // In a real app, you might want to fetch the station for this district to pre-fill it.
      // For simplicity, we just set the district directly.
      setSelectedStation(''); 
      setFormData({ name: church.name, district: church.district, is_active: church.is_active });
    } else {
      setEditingId(null);
      setSelectedStation('');
      setFormData({ name: '', district: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/churches/${editingId}/` 
      : `${process.env.NEXT_PUBLIC_API_URL}/api/churches/`;
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${session?.user?.apiToken}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchChurches();
    }
  };

  const filteredChurches = churches.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#232420]">Local Churches</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#0F6E56] text-white px-4 py-2 rounded-[8px] font-medium hover:bg-[#085041] transition-colors"
        >
          <Plus className="w-4 h-4" /> Register Branch
        </button>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E4E1D8] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E4E1D8] flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6A62]" />
            <input 
              type="text"
              placeholder="Search by church name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#FAF9F6] border-b border-[#E4E1D8] text-[#6B6A62]">
              <tr>
                <th className="px-6 py-4 font-medium">Church Name</th>
                <th className="px-6 py-4 font-medium">District</th>
                <th className="px-6 py-4 font-medium">Station</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E1D8]">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[#6B6A62]">Loading branches...</td></tr>
              ) : filteredChurches.map((church) => (
                <tr key={church.id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#232420] flex items-center gap-2">
                      <Church className="w-4 h-4 text-[#6B6A62]" />
                      {church.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#6B6A62]">{church.district_name}</td>
                  <td className="px-6 py-4 text-[#6B6A62]">{church.station_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      church.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {church.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(church)} className="text-[#185FA5] hover:bg-blue-50 p-1.5 rounded-md transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[12px] shadow-xl border border-[#E4E1D8]">
            <div className="flex justify-between items-center p-6 border-b border-[#E4E1D8]">
              <h3 className="text-lg font-bold text-[#232420]">{editingId ? 'Edit Branch' : 'Register New Branch'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B6A62] hover:text-[#232420]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#232420] mb-1">Church Name</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-[#E4E1D8] rounded-[8px] focus:border-[#0F6E56] outline-none"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-[#232420] mb-1">Filter by Station</label>
                  <select 
                    value={selectedStation} 
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="w-full px-4 py-2 border border-[#E4E1D8] rounded-[8px] focus:border-[#0F6E56] outline-none"
                  >
                    <option value="">Select Station...</option>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#232420] mb-1">Assign to District</label>
                <select 
                  required
                  value={formData.district} 
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                  className="w-full px-4 py-2 border border-[#E4E1D8] rounded-[8px] focus:border-[#0F6E56] outline-none"
                >
                  <option value="">Select District...</option>
                  {/* If editing, we just show a generic prompt or pre-fetch districts. For now, rely on dynamic fetch. */}
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-[#0F6E56] focus:ring-[#0F6E56] border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-[#232420]">Active Status</label>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-[#E4E1D8] rounded-[8px] font-medium text-[#232420] hover:bg-[#FAF9F6]">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-[#0F6E56] text-white rounded-[8px] font-medium hover:bg-[#085041]">
                  {editingId ? 'Save Changes' : 'Register Church'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
