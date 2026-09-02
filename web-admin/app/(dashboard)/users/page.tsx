'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Shield, User, X, Mail, Phone } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [staff, setStaff] = useState<any[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', 
    password: '', role: 'LOCAL_CLERK', church_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user?.role && session.user.role !== 'CONFERENCE_ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchStaff();
    fetchChurches();
  }, [session, router]);

  const fetchStaff = async () => {
    if (!session?.user?.apiToken) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/`, {
      headers: { 'Authorization': `Token ${session.user.apiToken}` }
    });
    const data = await res.json();
    setStaff(data);
    setLoading(false);
  };

  const fetchChurches = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/churches/`);
    const data = await res.json();
    setChurches(data.results || data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/staff/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${session?.user?.apiToken}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ first_name: '', last_name: '', email: '', phone_number: '', password: '', role: 'LOCAL_CLERK', church_id: '' });
        fetchStaff();
      } else {
        console.error('Failed to create staff');
      }
    } catch (error) {
      console.error('Error creating staff', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#232420]">Staff & Clerks</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#0F6E56] text-white px-4 py-2 rounded-[8px] font-medium hover:bg-[#085041] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E4E1D8] shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#FAF9F6] border-b border-[#E4E1D8] text-[#6B6A62]">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Contact</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Jurisdiction</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E1D8]">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-[#6B6A62]">Loading staff...</td></tr>
            ) : staff.map((user) => (
              <tr key={user.id} className="hover:bg-[#FAF9F6] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-[#232420] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#6B6A62]" />
                    {user.first_name} {user.last_name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-[#232420] flex items-center gap-2"><Mail className="w-3 h-3 text-[#6B6A62]" /> {user.email}</div>
                  <div className="text-[#6B6A62] text-xs flex items-center gap-2 mt-1"><Phone className="w-3 h-3" /> {user.phone_number}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                    user.role === 'CONFERENCE_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <Shield className="w-3 h-3 inline mr-1" />
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-[#232420]">{user.church_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[12px] shadow-xl border border-[#E4E1D8]">
            <div className="flex justify-between items-center p-6 border-b border-[#E4E1D8]">
              <h3 className="text-lg font-bold text-[#232420]">Add New Staff</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B6A62] hover:text-[#232420]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#232420] mb-1">First Name</label>
                  <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full px-4 py-2 border border-[#E4E1D8] rounded-[8px] focus:border-[#0F6E56] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#232420] mb-1">Last Name</label>
                  <input type="text" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full px-4 py-2 border border-[#E4E1D8] rounded-[8px] focus:border-[#0F6E56] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#232420] mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-[#E4E1D8] rounded-[8px] focus:border-[#0F6E56] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#232420] mb-1">Phone Number</label>
                  <input type="text" required value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="w-full px-4 py-2 border border-[#E4E1D8] rounded-[8px] focus:border-[#0F6E56] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#232420] mb-1">Temporary Password</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 border border-[#E4E1D8] rounded-[8px] focus:border-[#0F6E56] outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#232420] mb-1">Role</label>
                <CustomSelect 
                  value={formData.role} 
                  onChange={val => setFormData({...formData, role: val})} 
                  options={[
                    { value: 'LOCAL_CLERK', label: 'Local Clerk' },
                    { value: 'CONFERENCE_ADMIN', label: 'Conference Admin' }
                  ]}
                />
              </div>

              {formData.role === 'LOCAL_CLERK' && (
                <div>
                  <label className="block text-sm font-medium text-[#232420] mb-1">Assign Local Church</label>
                  <CustomSelect 
                    value={formData.church_id} 
                    onChange={val => setFormData({...formData, church_id: val})} 
                    placeholder="Select Church..."
                    options={churches.map(c => ({ value: String(c.id), label: c.name }))}
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-[#E4E1D8] rounded-[8px] font-medium text-[#232420] hover:bg-[#FAF9F6]">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-[8px] font-medium transition-colors ${
                    isSubmitting ? 'bg-[#A5D6A7] text-white cursor-not-allowed' : 'bg-[#0F6E56] text-white hover:bg-[#085041]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
