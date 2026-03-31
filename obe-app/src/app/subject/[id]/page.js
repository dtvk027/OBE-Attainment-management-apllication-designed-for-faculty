'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Component Imports (we will build these next)
import DirectAttainmentSheet from '@/components/sheets/DirectAttainmentSheet';
import IndirectAttainmentSheet from '@/components/sheets/IndirectAttainmentSheet';
import CombinedAttainmentSheet from '@/components/sheets/CombinedAttainmentSheet';
import POPSOAttainmentSheet from '@/components/sheets/POPSOAttainmentSheet';
import IntroductorySheet from '@/components/sheets/IntroductorySheet';
import SurveyFormSheet from '@/components/sheets/SurveyFormSheet';
import ImportDialog from '@/components/ImportDialog';
import AttainmentSummary from '@/components/AttainmentSummary';

import { calcDirectAttainment, calcIndirectAttainment, calcCombinedAttainment, calcPOAttainment } from '@/lib/calc-engine';

export default function SubjectViewPage({ params }) {
  const router = useRouter();
  const [subjectData, setSubjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('direct');
  const [showImport, setShowImport] = useState(false);

  // Computed state
  const [calculations, setCalculations] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.user?.role === 'admin');
      }
    } catch (e) {
      console.error('Session error', e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/subjects/${params.id}/all-data`);
      if (!res.ok) throw new Error('Failed to fetch subject data');
      const data = await res.json();
      setSubjectData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchSession();
    fetchData();
  }, [fetchSession, fetchData]);

  useEffect(() => {
    if (subjectData && subjectData.template) {
      try {
        // Run full calculation pipeline
        const direct = calcDirectAttainment(subjectData.students, subjectData.template);
        const indirect = calcIndirectAttainment(subjectData.surveyResponses, subjectData.template);
        const combined = calcCombinedAttainment(direct.summary.combined, indirect, subjectData.template);
        const poPso = calcPOAttainment(combined, subjectData.coPOMappings, subjectData.template);

        setCalculations({
          direct,
          indirect,
          combined,
          poPso
        });
      } catch (err) {
        console.error("Calculation Engine Error", err);
      }
    }
  }, [subjectData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Loading Subject Data...</p>
    </div>
  );
  if (error) return <div className="p-10 text-red-500 font-bold border border-red-100 bg-red-50 rounded-xl">{error}</div>;
  if (!subjectData) return null;

  return (
    <div style={{ padding: '2rem 3rem', width: '100%', margin: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '1.5rem' }}>
        <div>
          <Link href="/dashboard" style={{ fontSize: '0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', textDecoration: 'none' }}>
            &larr; Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.025em', fontSize: '2.25rem' }}>{subjectData.name} ({subjectData.code})</h1>
            {isAdmin && (
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">
                Read-Only Overview
              </span>
            )}
          </div>
          <p className="subtitle" style={{ margin: '0.5rem 0 0 0', textAlign: 'left', fontWeight: 600, color: '#94a3b8' }}>
            Section {subjectData.section} | {subjectData.semester.academicYear?.label} Sem {subjectData.semester.number} | Faculty ID: {subjectData.facultyId}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!isAdmin && (
            <button className="flex items-center gap-2 bg-[#475569] hover:bg-[#334155] text-white px-5 py-2.5 rounded-lg font-bold shadow-lg transition-all text-sm" onClick={() => setShowImport(true)}>
              Import Data
            </button>
          )}
          <a href={`/api/subjects/${subjectData.id}/export`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-lg font-bold shadow-lg transition-all text-sm no-underline">
            Export Report (.xlsx)
          </a>
        </div>
      </div>

      <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '2.5rem' }}>
        {[
          { id: 'intro', label: 'Introductory' },
          { id: 'direct', label: 'CO-Direct Attain' },
          { id: 'indirect', label: 'CO-Indirect Attain' },
          { id: 'combined', label: 'CO Attain (Dir + Ind)' },
          { id: 'po', label: 'PO-PSO Attainment' },
          { id: 'survey-form', label: 'Survey Form Template' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0',
              borderBottom: activeTab === tab.id ? '3px solid #0f172a' : '3px solid transparent',
              color: activeTab === tab.id ? '#0f172a' : '#94a3b8',
              fontWeight: activeTab === tab.id ? 900 : 700,
              cursor: 'pointer',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '2rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        {calculations ? (
          <>
            {activeTab === 'intro' && <IntroductorySheet subject={subjectData} isAdmin={isAdmin} />}
            {activeTab === 'direct' && <DirectAttainmentSheet subject={subjectData} calculations={calculations.direct} onDataChange={fetchData} isAdmin={isAdmin} />}
            {activeTab === 'indirect' && <IndirectAttainmentSheet subject={subjectData} calculations={calculations.indirect} onDataChange={fetchData} isAdmin={isAdmin} />}
            {activeTab === 'combined' && <CombinedAttainmentSheet subject={subjectData} calculations={calculations.combined} isAdmin={isAdmin} />}
            {activeTab === 'po' && <POPSOAttainmentSheet subject={subjectData} calculations={calculations.poPso} onDataChange={fetchData} isAdmin={isAdmin} />}
            {activeTab === 'survey-form' && <SurveyFormSheet subject={subjectData} isAdmin={isAdmin} />}
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none">Running Calculation Engine...</p>
          </div>
        )}
      </div>

      {showImport && (
        <ImportDialog 
          subject={subjectData}
          onClose={() => setShowImport(false)}
          onImportSuccess={(msg) => {
            alert(msg);
            setShowImport(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
