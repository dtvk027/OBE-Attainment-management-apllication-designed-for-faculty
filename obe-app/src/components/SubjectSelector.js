'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

export default function SubjectSelector() {
  const router = useRouter();
  const [data, setData] = useState({ academicYears: [], mySubjects: [], globalCatalog: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection states
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [selectedGlobalId, setSelectedGlobalId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      const res = await fetch('/api/subjects/hierarchy');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch academic configuration');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedYear = data.academicYears.find(y => y.id === parseInt(selectedYearId));
  const availableSemesters = selectedYear?.semesters || [];

  const handleCreateOpenTable = async () => {
    if (!selectedYearId || !selectedSemesterId || !selectedGlobalId || !selectedSection) return;

    const existing = data.mySubjects.find(s => 
      s.globalSubjectId === parseInt(selectedGlobalId) && 
      s.semesterId === parseInt(selectedSemesterId) && 
      s.section === selectedSection
    );

    if (existing) {
      router.push(`/subject/${existing.id}`);
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/subjects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yearId: parseInt(selectedYearId),
          semesterId: parseInt(selectedSemesterId),
          globalSubjectId: parseInt(selectedGlobalId),
          section: selectedSection,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Initialization failed');
      
      // Refresh the server-side dashboard before navigating
      router.refresh();
      router.push(`/subject/${json.subjectId}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center py-12 text-subtle">
      <Loader2 className="animate-spin mb-4" size={32} />
      <p className="text-sm font-semibold uppercase tracking-widest">Synchronizing...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 mb-6">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Step 1: Academic Year */}
        <div className="form-group">
          <label>Academic Year</label>
          <select 
            value={selectedYearId} 
            onChange={(e) => { 
              setSelectedYearId(e.target.value); 
              setSelectedSemesterId('');
              setSelectedGlobalId(''); 
              setSelectedSection(''); 
              setError(null);
            }}
          >
            <option value="">Choose Year</option>
            {data.academicYears.map(ay => (
              <option key={ay.id} value={ay.id}>{ay.label}</option>
            ))}
          </select>
        </div>

        {/* Step 2: Semester */}
        {selectedYearId && (
          <div className="form-group fade-in">
            <label>Semester</label>
            <select 
              value={selectedSemesterId} 
              onChange={(e) => {
                setSelectedSemesterId(e.target.value);
                setSelectedGlobalId('');
                setSelectedSection('');
              }}
            >
              <option value="">Choose Semester</option>
              {availableSemesters.map(sem => (
                <option key={sem.id} value={sem.id}>Semester {sem.number}</option>
              ))}
            </select>
          </div>
        )}

        {/* Step 3: Subject Code */}
        {selectedSemesterId && (
          <div className="form-group fade-in">
            <label>Subject / Course</label>
            <select 
              value={selectedGlobalId} 
              onChange={(e) => { 
                setSelectedGlobalId(e.target.value); 
                setSelectedSection(''); 
              }}
            >
              <option value="">Choose Subject</option>
              {data.globalCatalog.map(item => (
                <option key={item.id} value={item.id}>{item.code} • {item.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Step 4: Section */}
        {selectedGlobalId && (
          <div className="form-group fade-in">
            <label>Section</label>
            <div className="grid grid-cols-5 gap-2">
              {['A', 'B', 'C', 'D', 'E'].map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSection(sec)}
                  className={`py-2.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedSection === sec 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-main text-subtle hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button 
            onClick={handleCreateOpenTable} 
            disabled={creating || !selectedSection}
            className="btn-primary w-full group"
          >
            {creating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Initializing...</span>
              </>
            ) : (
              <>
                <span>{data.mySubjects.some(s => s.globalSubjectId === parseInt(selectedGlobalId) && s.semesterId === parseInt(selectedSemesterId) && s.section === selectedSection) ? 'Open Existing Table' : 'Initialize New Table'}</span>
                <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
