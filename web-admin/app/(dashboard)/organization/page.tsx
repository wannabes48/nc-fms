'use client';
import React, { useState, useEffect } from 'react';
import { Building2, Map, MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function OrganizationPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.apiToken;

  const [activeTab, setActiveTab] = useState('stations');
  const [stations, setStations] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  
  // Form States
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', stationId: '', districtId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    const headers: HeadersInit = token ? { 'Authorization': `Token ${token}` } : {};
    
    const [statRes, distRes, churRes] = await Promise.all([
      fetch(`${API_URL}/api/stations/`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/api/districts/`, { headers }).then(res => res.json()),
      fetch(`${API_URL}/api/churches/`, { headers }).then(res => res.json())
    ]);
    
    // Handle paginated responses (.results) or flat arrays
    setStations(statRes.results || statRes || []);
    setDistricts(distRes.results || distRes || []);
    setChurches(churRes.results || churRes || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const endpoint = activeTab === 'stations' ? 'stations' : activeTab === 'districts' ? 'districts' : 'churches';
    
    const payload: any = { name: formData.name };
    if (activeTab === 'districts') payload.station = formData.stationId;
    if (activeTab === 'churches') payload.district = formData.districtId;

    try {
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Token ${token}` } : {})
      };
      
      const res = await fetch(`${API_URL}/api/${endpoint}/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', stationId: '', districtId: '' });
        fetchData(); // Refresh lists
      } else {
        alert('Failed to add entry. Check your data.');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    
    setDeletingId(id);
    const endpoint = activeTab === 'stations' ? 'stations' : activeTab === 'districts' ? 'districts' : 'churches';
    try {
      const headers: HeadersInit = token ? { 'Authorization': `Token ${token}` } : {};
      const res = await fetch(`${API_URL}/api/${endpoint}/${id}/`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        fetchData(); // Refresh lists
      } else {
        alert('Failed to delete entry. Make sure it has no nested items.');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#232420]">Organization Structure</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#0F6E56] text-white px-4 py-2 rounded-[8px] hover:bg-[#085041]"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {/* ADD FORM MODAL / DROPDOWN */}
      {showForm && (
        <div className="mb-8 p-6 bg-[#FAF9F6] border border-[#E4E1D8] rounded-[12px]">
          <h3 className="font-semibold mb-4 text-[#232420]">
            Add New {activeTab === 'stations' ? 'Station' : activeTab === 'districts' ? 'District' : 'Local Church'}
          </h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-[#6B6A62] mb-1">Name</label>
              <input 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border border-[#E4E1D8] p-2 rounded-[8px] text-[#232420]" 
              />
            </div>
            
            {activeTab === 'districts' && (
              <div className="flex-1">
                <label className="block text-sm text-[#6B6A62] mb-1">Parent Station</label>
                <select 
                  required 
                  value={formData.stationId} 
                  onChange={e => setFormData({...formData, stationId: e.target.value})}
                  className="w-full border border-[#E4E1D8] p-2 rounded-[8px] text-[#232420]"
                >
                  <option value="">Select Station...</option>
                  {stations.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {activeTab === 'churches' && (
              <div className="flex-1">
                <label className="block text-sm text-[#6B6A62] mb-1">Parent District</label>
                <select 
                  required 
                  value={formData.districtId} 
                  onChange={e => setFormData({...formData, districtId: e.target.value})}
                  className="w-full border border-[#E4E1D8] p-2 rounded-[8px] text-[#232420]"
                >
                  <option value="">Select District...</option>
                  {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`bg-[#0F6E56] text-white px-6 py-2 rounded-[8px] h-[42px] flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-[#E4E1D8] mb-6">
        {[
          { id: 'stations', label: 'Stations', icon: Building2 },
          { id: 'districts', label: 'Districts', icon: Map },
          { id: 'churches', label: 'Local Churches', icon: MapPin }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
              activeTab === tab.id 
                ? 'border-[#0F6E56] text-[#0F6E56]' 
                : 'border-transparent text-[#6B6A62] hover:text-[#232420]'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* DATA TABLES */}
      <div className="bg-white border border-[#E4E1D8] rounded-[12px] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#FAF9F6] border-b border-[#E4E1D8] text-sm text-[#6B6A62]">
            <tr>
              <th className="p-4 font-medium">Name</th>
              {activeTab === 'districts' && <th className="p-4 font-medium">Station</th>}
              {activeTab === 'churches' && <th className="p-4 font-medium">District</th>}
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'stations' ? stations : activeTab === 'districts' ? districts : churches).map((item: any) => (
              <tr key={item.id} className="border-b border-[#E4E1D8] last:border-0 hover:bg-[#FAF9F6]">
                <td className="p-4 font-medium text-[#232420]">{item.name}</td>
                
                {activeTab === 'districts' && (
                  <td className="p-4 text-[#6B6A62]">
                    {/* Assuming the API returns the nested station name or we find it locally */}
                    {stations.find((s: any) => s.id === item.station)?.name || 'Unknown Station'}
                  </td>
                )}
                
                {activeTab === 'churches' && (
                  <td className="p-4 text-[#6B6A62]">
                    {districts.find((d: any) => d.id === item.district)?.name || 'Unknown District'}
                  </td>
                )}

                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-[8px] disabled:opacity-50 flex items-center justify-center float-right"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
            
            {(activeTab === 'stations' ? stations : activeTab === 'districts' ? districts : churches).length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-[#6B6A62]">
                  No {activeTab} found. Click "Add New" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
