'use client';

import React, { useEffect, useState } from 'react';
import { UserPlus, ChevronDown, ChevronRight, Book, Mail, Building, Calendar, ExternalLink, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FacultyManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      setSuccess('Faculty profile created successfully');
      setFormData({ name: '', email: '', password: '', department: '' });
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };



  return (
    <div className="fade-in max-w-7xl mx-auto pb-20">
      <header className="mb-12 flex flex-col gap-6">
        <div>
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 transition-all font-black text-[10px] uppercase tracking-widest mb-6 border border-zinc-200 shadow-sm shadow-zinc-100/50"
          >
            <ArrowLeft size={14} />
            <span>Back to Hub</span>
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2 italic">Faculty Directory</h1>
              <p className="text-sm text-zinc-500 font-medium">Oversee academic staff and their course assignments across the institution.</p>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-3 shadow-xl active:scale-95 transition-all shadow-zinc-200 ${
                showAddForm 
                  ? 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {showAddForm ? 'Cancel Registration' : (
                <>
                  <UserPlus size={18} />
                  <span>Register New Faculty</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
        <ShieldCheck size={18} /> {error}
      </div>}
      {success && <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm font-bold flex items-center gap-2">
        <ShieldCheck size={18} /> {success}
      </div>}

      {showAddForm && (
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 mb-10 shadow-xl shadow-zinc-100/50 scale-in">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-6">New Faculty Registration</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Full Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Prof. Alan Turing"
                className="w-full bg-zinc-50 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-zinc-300 focus:bg-white focus:border-zinc-900 transition-all"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="faculty@university.edu"
                className="w-full bg-zinc-50 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-zinc-300 focus:bg-white focus:border-zinc-900 transition-all"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Initial Password</label>
              <input 
                type="password" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder="••••••••"
                className="w-full bg-zinc-50 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-zinc-300 focus:bg-white focus:border-zinc-900 transition-all"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Academic Department</label>
              <input 
                type="text" 
                value={formData.department} 
                onChange={e => setFormData({...formData, department: e.target.value})} 
                placeholder="e.g. Computer Science"
                className="w-full bg-zinc-50 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-zinc-300 focus:bg-white focus:border-zinc-900 transition-all"
              />
            </div>
            <div className="col-span-2 pt-4">
              <button type="submit" className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
                Create Faculty Profile
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-zinc-400 font-bold uppercase tracking-widest animate-pulse">Synchronizing directory...</div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 text-zinc-400 font-medium italic">No faculty members found.</div>
        ) : (
          users.map(user => (
            <div key={user.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-zinc-100 transition-all">
              <div 
                className="p-6 flex items-center justify-between cursor-pointer group"
                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 text-lg font-black group-hover:bg-zinc-900 group-hover:text-white transition-all">
                    {user.name?.[0] || 'F'}
                  </div>
                  <div>
                    <h3 className="font-black text-zinc-900 text-lg tracking-tight leading-none mb-1">{user.name}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Mail size={12} /> {user.email}</span>
                      <span className="flex items-center gap-1.5"><Building size={12} /> {user.department || 'No Dept'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Assigned Subjects</p>
                    <p className="text-sm font-black text-zinc-900 tabular-nums">{user.subjects?.length || 0}</p>
                  </div>

                  <div className="p-2 text-zinc-300 group-hover:text-zinc-900 transition-colors">
                    {expandedUser === user.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </div>
              </div>

              {expandedUser === user.id && (
                <div className="px-6 pb-6 pt-2 border-t border-zinc-50 bg-zinc-50/30 animate-slide-down">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 ml-1">Current Workload & Sections</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.subjects && user.subjects.length > 0 ? (
                      user.subjects.map((sub) => (
                        <div key={sub.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-full group/card relative overflow-hidden">
                          <div className="flex justify-between items-start mb-4">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-black text-[10px] uppercase tracking-tighter border border-indigo-100">
                              {sub.code}
                            </span>
                            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Sec {sub.section}</span>
                          </div>
                          <h5 className="font-black text-zinc-900 text-sm tracking-tight mb-auto leading-tight group-hover/card:text-indigo-600 transition-colors">{sub.name}</h5>
                          <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Calendar size={12} /> {sub.semester?.academicYear?.label}</span>
                              <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                              <span>Sem {sub.semester?.number}</span>
                            </div>
                            <Link 
                              href={`/subject/${sub.id}?adminMode=true`}
                              className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-white hover:scale-110 transition-all active:scale-95"
                              title="View Section Data"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest italic opacity-50 bg-zinc-50/50 rounded-2xl border-2 border-dashed border-zinc-200">
                        No subjects assigned to this faculty member.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
