import React from 'react';

export default function SurveyFormSheet({ subject }) {
  const coStatements = subject.coStatements ? JSON.parse(subject.coStatements) : {};
  const coList = Object.keys(coStatements).sort();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--primary)', margin: 0 }}>Course Exit Survey Form Template</h2>
        {coList.length > 0 && (
          <button 
            onClick={() => window.print()} 
            style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Print Survey
          </button>
        )}
      </div>

      <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
        This template can be used to create Google Forms or paper-based surveys for indirect attainment collection.
      </p>

      {coList.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-zinc-200 rounded-lg">
          <p className="text-zinc-400 font-bold text-lg">No Course Outcomes found.</p>
          <p className="text-zinc-500 mt-2">Please define your CO statements on the <span className="font-bold text-[#00BFEE]">Introductory</span> tab first.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6" id="survey-form-container">
          {coList.map((co, index) => (
            <div key={co} className="border border-black overflow-hidden shadow-sm page-break-avoid">
              <div className="bg-[#00BFEE] text-white px-4 py-2 font-black flex justify-between items-center text-xs uppercase tracking-widest">
                <span>Question {index + 1}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded">{co}</span>
              </div>
              <div className="p-5 bg-white">
                <p className="mb-4 text-[13px] leading-relaxed text-zinc-800">
                  How well are you able to: <span className="font-bold border-b border-dotted border-zinc-400 italic">{"\""}{coStatements[co]}{"\""}</span>?
                </p>
                <div className="flex gap-8 text-[11px] font-bold text-zinc-600 uppercase tracking-tight">
                  <label className="flex items-center gap-2 cursor-not-allowed opacity-80">
                    <div className="w-4 h-4 border border-black rounded-full"></div>
                    3 - Excellent
                  </label>
                  <label className="flex items-center gap-2 cursor-not-allowed opacity-80">
                    <div className="w-4 h-4 border border-black rounded-full"></div>
                    2 - Satisfactory
                  </label>
                  <label className="flex items-center gap-2 cursor-not-allowed opacity-80">
                    <div className="w-4 h-4 border border-black rounded-full"></div>
                    1 - Average
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="no-print" style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
        <h3 style={{ marginBottom: '1rem' }}>Survey Administration Instructions</h3>
        <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Distribute this survey to students at the end of the semester.</li>
          <li>Collect responses and count the number of students who selected each level for every CO.</li>
          <li>Enter the counts in the <strong>CO-Indirect Attain</strong> tab to calculate indirect attainment.</li>
        </ul>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          #survey-form-container, #survey-form-container * {
            visibility: visible;
          }
          #survey-form-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
