'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layout, ArrowLeft, Plus, ShieldCheck, Code, Settings, Target, Layers, Trash2 } from 'lucide-react';

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    coCount: 5,
    poCount: 12,
    psoCount: 3,
    targetPercentage: 60,
    directWeightage: 0.9,
    indirectWeightage: 0.1,
    assessmentGroups: JSON.stringify({
      internal: [{ id: "mid_01", label: "Mid-01", max_marks_total: 15, per_co: true, co_columns: ["CO1", "CO2", "CO3", "CO4", "CO5"] }],
      end_semester: { id: "end_sem", label: "End Examination", per_co: true, co_columns: ["CO1", "CO2", "CO3", "CO4", "CO5"] }
    }, null, 2)
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (res.ok) setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      let groups;
      try {
        groups = JSON.parse(formData.assessmentGroups);
      } catch (e) {
        throw new Error("Invalid JSON in Assessment Groups field");
      }

      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, assessmentGroups: groups }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create template');

      setSuccess('Template created successfully');
      setShowAddForm(false);
      setFormData({
        name: '',
        coCount: 5,
        poCount: 12,
        psoCount: 3,
        targetPercentage: 60,
        directWeightage: 0.9,
        indirectWeightage: 0.1,
        assessmentGroups: JSON.stringify({
          internal: [{ id: "mid_01", label: "Mid-01", max_marks_total: 15, per_co: true, co_columns: ["CO1", "CO2", "CO3", "CO4", "CO5"] }],
          end_semester: { id: "end_sem", label: "End Examination", per_co: true, co_columns: ["CO1", "CO2", "CO3", "CO4", "CO5"] }
        }, null, 2)
      });
      fetchTemplates();
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
              <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2 italic">OBE Templates</h1>
              <p className="text-sm text-zinc-500 font-medium">Configure institution-wide attainment formulas and assessment structures.</p>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-3 shadow-xl active:scale-95 transition-all shadow-zinc-200 ${
                showAddForm 
                  ? 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {showAddForm ? 'Cancel Configuration' : (
                <>
                  <Plus size={18} />
                  <span>Create New Format</span>
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
        <div className="bg-white p-10 rounded-3xl border border-zinc-200 mb-12 shadow-2xl shadow-zinc-100/50 scale-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
              <Settings size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Define New OBE Format</h3>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Template Label</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. 2-Mid OBE Attainment Format 2024"
                  className="w-full bg-zinc-50 border-zinc-200 rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-zinc-300 focus:bg-white focus:border-zinc-900 transition-all shadow-sm"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 flex items-center gap-2"><Target size={12} /> CO Count</label>
                <input type="number" value={formData.coCount} onChange={e => setFormData({...formData, coCount: parseInt(e.target.value)})} className="w-full bg-zinc-50 border-zinc-200 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-zinc-900 transition-all shadow-sm" required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 flex items-center gap-2"><ShieldCheck size={12} /> Target %</label>
                <input type="number" value={formData.targetPercentage} onChange={e => setFormData({...formData, targetPercentage: parseInt(e.target.value)})} className="w-full bg-zinc-50 border-zinc-200 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-zinc-900 transition-all shadow-sm" required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 flex items-center gap-2"><Layers size={12} /> Direct Weight (0-1)</label>
                <input type="number" step="0.1" value={formData.directWeightage} onChange={e => setFormData({...formData, directWeightage: parseFloat(e.target.value)})} className="w-full bg-zinc-50 border-zinc-200 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-zinc-900 transition-all shadow-sm" required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Indirect Weight (0-1)</label>
                <input type="number" step="0.1" value={formData.indirectWeightage} onChange={e => setFormData({...formData, indirectWeightage: parseFloat(e.target.value)})} className="w-full bg-zinc-50 border-zinc-200 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-zinc-900 transition-all shadow-sm" required />
              </div>
            </div>

            <div className="space-y-3 mb-10">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 flex items-center gap-2"><Code size={12} /> Assessment Groups Configuration (JSON)</label>
              <textarea 
                rows="8"
                className="w-full bg-zinc-50 border-zinc-200 rounded-3xl px-6 py-5 text-xs font-mono font-bold leading-relaxed focus:bg-white focus:border-zinc-900 transition-all shadow-inner"
                value={formData.assessmentGroups}
                onChange={e => setFormData({...formData, assessmentGroups: e.target.value})}
                required
              />
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest ml-1 leading-relaxed">
                Define columns and grouping logic for the Direct Attainment sheet using standard JSON schema.
              </p>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-10 py-4 bg-zinc-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 shadow-xl active:scale-95 transition-all">
                Publish Template
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-zinc-400 uppercase font-black tracking-widest text-xs animate-pulse italic">
            Synchronizing Templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 uppercase font-black tracking-widest text-xs italic">
            No academic formats defined yet.
          </div>
        ) : (
          templates.map(tmpl => (
            <div key={tmpl.id} className="group bg-white p-8 rounded-3xl border border-zinc-200 hover:border-zinc-900 transition-all shadow-xl shadow-zinc-100/50 relative overflow-hidden flex flex-col">
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all mb-6">
                <Code size={20} />
              </div>
              
              <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-4 leading-tight group-hover:text-zinc-600 transition-colors uppercase italic">{tmpl.name}</h3>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-8 mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>CO Count: {tmpl.coCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Target: {tmpl.targetPercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Direct: {tmpl.directWeightage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  <span>Indirect: {tmpl.indirectWeightage}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-300">Created {new Date(tmpl.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Active Format</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
