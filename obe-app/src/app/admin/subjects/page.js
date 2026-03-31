'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, FileText, Users, ExternalLink, X, Loader2, AlertCircle, FilePlus, FileMinus, ArrowLeft } from 'lucide-react';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(null); // stores the subject object
  const [showEditDocModal, setShowEditDocModal] = useState(null); // stores the subject object
  
  // Form states
  const [formData, setFormData] = useState({ name: '', code: '', file: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/admin/global-subjects');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch subjects');
      setSubjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.file) return;

    setSubmitting(true);
    const body = new FormData();
    body.append('name', formData.name);
    body.append('code', formData.code);
    body.append('documentation', formData.file);

    try {
      const res = await fetch('/api/admin/global-subjects', {
        method: 'POST',
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add subject');
      
      setShowAddModal(false);
      setFormData({ name: '', code: '', file: null });
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    
    try {
      const res = await fetch(`/api/admin/global-subjects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateDoc = async (e) => {
    e.preventDefault();
    if (!showEditDocModal || !formData.file) return;

    setSubmitting(true);
    const body = new FormData();
    body.append('documentation', formData.file);

    try {
      const res = await fetch(`/api/admin/global-subjects/${showEditDocModal.id}`, {
        method: 'PATCH',
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update documentation');
      
      setShowEditDocModal(null);
      setFormData({ ...formData, file: null });
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDoc = async (id) => {
    if (!confirm('Are you sure you want to remove the documentation for this subject? Faculty will see "no data provided" until updated.')) return;
    
    try {
      const body = new FormData();
      body.append('documentation', 'null');
      
      const res = await fetch(`/api/admin/global-subjects/${id}`, {
        method: 'PATCH',
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove documentation');
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-zinc-400 mb-4" size={32} />
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading Global Catalog...</p>
    </div>
  );

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
              <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2 italic">Global Subject Repository</h1>
              <p className="text-sm text-zinc-500 font-medium">Standardized academic catalog and official curriculum documentation management.</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-4 bg-zinc-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-3 hover:bg-zinc-800 shadow-xl active:scale-95 transition-all shadow-zinc-200"
            >
              <Plus size={18} />
              <span>Register New Subject</span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xl shadow-zinc-100/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Code</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Subject Name</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Documentation</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {subjects.map((sub) => (
              <tr key={sub.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-black text-xs border border-indigo-100">
                    {sub.code}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-zinc-900">{sub.name}</p>
                </td>
                <td className="px-6 py-4">
                  {sub.documentationPath ? (
                    <div className="flex items-center gap-4">
                      <a 
                        href={sub.documentationPath} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:underline"
                      >
                        <FileText size={14} />
                        View PDF
                        <ExternalLink size={10} />
                      </a>
                      <button 
                        onClick={() => handleRemoveDoc(sub.id)}
                        className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-600 flex items-center gap-1"
                      >
                        <FileMinus size={12} /> Remove
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowEditDocModal(sub)}
                      className="text-xs text-indigo-600 font-black uppercase tracking-tighter flex items-center gap-1.5 hover:text-indigo-800"
                    >
                      <FilePlus size={14} /> Add Documentation
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => setShowFacultyModal(sub)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-600 hover:bg-zinc-900 hover:text-white transition-all shadow-sm active:scale-95 border border-zinc-200 hover:border-zinc-900"
                    >
                      <Users size={14} />
                      View Faculty
                    </button>
                    <button 
                      onClick={() => setShowEditDocModal(sub)}
                      className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 border border-indigo-100"
                      title="Update Documentation"
                    >
                      <FilePlus size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(sub.id)}
                      className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 border border-red-100"
                      title="Delete Subject"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-16 text-center text-zinc-400 font-medium italic">
                  No subjects defined in the global repository.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 overflow-hidden scale-in">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-black text-zinc-900 uppercase tracking-tight">Add Global Subject</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubject} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Subject Code</label>
                <input 
                  type="text"
                  placeholder="e.g. CS301"
                  className="w-full bg-zinc-50 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-zinc-300 focus:bg-white focus:border-zinc-900 transition-all"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Subject Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Database Management Systems"
                  className="w-full bg-zinc-50 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-zinc-300 focus:bg-white focus:border-zinc-900 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Documentation (PDF Only)</label>
                <div className="relative">
                  <input 
                    type="file"
                    accept=".pdf"
                    className="w-full bg-zinc-50 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-zinc-300 focus:bg-white focus:border-zinc-900 transition-all"
                    onChange={e => setFormData({...formData, file: e.target.files[0]})}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                    <FileText size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 font-bold ml-1 italic">* This documentation will be visible to all faculty assigned to this subject.</p>
              </div>
              
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-zinc-200"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Register Subject'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Documentation Modal */}
      {showEditDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 overflow-hidden scale-in">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-black text-zinc-900 uppercase tracking-tight">Update Documentation</h3>
              <button onClick={() => setShowEditDocModal(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateDoc} className="p-6 space-y-5">
              <p className="text-xs font-bold text-zinc-500">Updating documentation for <span className="text-zinc-900 font-black">{showEditDocModal.code}</span></p>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">New Documentation (PDF Only)</label>
                <div className="relative">
                  <input 
                    type="file"
                    accept=".pdf"
                    className="w-full bg-zinc-50 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-zinc-300 focus:bg-white focus:border-zinc-900 transition-all"
                    onChange={e => setFormData({...formData, file: e.target.files[0]})}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                    <FileText size={18} />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-zinc-200"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Update PDF Document'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Modal */}
      {showFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 overflow-hidden scale-in">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-black text-zinc-900 uppercase tracking-tight leading-none">{showFacultyModal.code}</h3>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Faculty Members</span>
                </div>
              </div>
              <button onClick={() => setShowFacultyModal(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {showFacultyModal.subjects && showFacultyModal.subjects.length > 0 ? (
                <div className="space-y-3">
                  {showFacultyModal.subjects.map((sub, idx) => (
                    <div key={idx} className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-sm font-black text-zinc-900 uppercase">{sub.faculty.name}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                          {sub.semester.academicYear.label} • Sem {sub.semester.number} • Sec {sub.section}
                        </p>
                      </div>
                      <div className="h-2 w-2 bg-green-500 rounded-full shadow-sm shadow-green-200" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-400 italic text-sm">
                  No faculty members are currently handling this subject.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
