import React, { useState } from 'react';
import { FileText, AlertCircle, ExternalLink, Info } from 'lucide-react';

export default function IntroductorySheet({ subject, onDataChange, isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State for editable fields
  const [dept, setDept] = useState(subject.department || '');
  const [prog, setProg] = useState(subject.program || '');

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: dept,
          program: prog,
        })
      });
      if (!res.ok) throw new Error("Failed to save subject metadata");
      setIsEditing(false);
      if (onDataChange) onDataChange();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const docPath = subject.globalSubject?.documentationPath;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-lg">
            <Info size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Course Information</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Institutional Metadata</p>
          </div>
        </div>
        {!isAdmin && (
          !isEditing ? (
            <button 
              onClick={() => setIsEditing(true)} 
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 border border-zinc-200"
            >
              Edit Details
            </button>
          ) : (
            <div className="flex gap-2">
               <button 
                 onClick={() => setIsEditing(false)} 
                 className="bg-white border border-zinc-200 text-zinc-400 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:text-zinc-900 transition-all"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSave} 
                 disabled={loading} 
                 className="bg-zinc-900 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
               >
                 {loading ? 'Saving...' : 'Confirm Changes'}
               </button>
            </div>
          )
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 bg-zinc-50 border border-zinc-100 p-8 rounded-2xl shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 ml-0.5">Title & Code</span>
            <p className="text-sm font-black text-zinc-900">{subject.name} <span className="font-medium text-zinc-400">({subject.code})</span></p>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 ml-0.5">Academic Unit</span>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input 
                  value={dept} 
                  onChange={e => setDept(e.target.value.toUpperCase())} 
                  className="bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-sm font-bold w-full focus:ring-2 focus:ring-zinc-900 outline-none" 
                  placeholder="e.g. CSE" 
                />
              ) : (
                <span className="text-sm font-black text-indigo-600">{subject.department || 'PENDING ASSIGNMENT'}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 ml-0.5">Program Framework</span>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input 
                  value={prog} 
                  onChange={e => setProg(e.target.value)} 
                  className="bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-sm font-bold w-full focus:ring-2 focus:ring-zinc-900 outline-none" 
                  placeholder="e.g. B.Tech (Hons)" 
                />
              ) : (
                <span className="text-sm font-black text-zinc-700">{subject.program || 'GENERAL PROGRAM'}</span>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col">
             <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 ml-0.5">Instance Identifier</span>
             <p className="text-sm font-black text-zinc-900">{subject.semester?.academicYear?.label} • Sem {subject.semester?.number} • Sec {subject.section}</p>
          </div>
          <div className="flex flex-col">
             <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 ml-0.5">Lead Instructor</span>
             <p className="text-sm font-black text-zinc-900 uppercase tracking-tighter">{subject.faculty?.name || 'NOT ASSIGNED'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
            <FileText size={16} />
            Official Subject Documentation
          </h3>
          {docPath && (
            <a 
              href={docPath} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-black uppercase tracking-tighter text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100"
            >
              Open Externally <ExternalLink size={10} />
            </a>
          )}
        </div>

        {docPath ? (
          <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-inner h-[600px] relative group">
            <iframe 
              src={`${docPath}#toolbar=0&navpanes=0`} 
              className="w-full h-full border-none"
              title="Subject Documentation"
            />
            <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">
              Secured Document Preview
            </div>
          </div>
        ) : (
          <div className="py-20 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-300">
              <AlertCircle size={32} />
            </div>
            <div>
              <p className="text-sm font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">no data provided</p>
              <p className="text-[11px] text-zinc-400 font-bold max-w-xs mx-auto italic">
                Official documentation has not been uploaded by the Administrator for this subject.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
