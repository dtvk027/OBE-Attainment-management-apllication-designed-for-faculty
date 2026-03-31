import React from 'react';

export default function IndirectAttainmentSheet({ subject, calculations }) {
  const template = subject.template;
  const surveyGrading = typeof template.surveyGrading === 'string'
    ? JSON.parse(template.surveyGrading)
    : template.surveyGrading;

  const coList = Array.from({ length: template.coCount }, (_, i) => `CO${i + 1}`);

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-main">Indirect Attainment</h2>
        <p className="text-sm text-subtle mt-1">Aggregated data from Course Exit Survey responses.</p>
      </div>

      <div className="overflow-x-auto border border-black">
        <table className="w-full border-collapse text-[12px] font-sans">
          <thead>
            <tr className="bg-[#00BFEE] text-white font-bold uppercase tracking-tight">
              <th rowSpan={2} className="p-3 border border-black text-left">Course Outcome</th>
              <th colSpan={3} className="p-2 border border-black text-center bg-[#ADD8E6] text-black">Survey Responses Frequency</th>
              <th rowSpan={2} className="p-3 border border-black text-center">Total Participants</th>
              <th rowSpan={2} className="p-3 border border-black text-center bg-[#FFFF00] text-black">Attainment Level</th>
            </tr>
            <tr className="bg-[#F8FAFC] text-black font-bold">
              <th className="p-2 border border-black text-center text-[10px]">Excellent ({surveyGrading.excellent})</th>
              <th className="p-2 border border-black text-center text-[10px]">Satisfactory ({surveyGrading.satisfactory})</th>
              <th className="p-2 border border-black text-center text-[10px]">Average ({surveyGrading.average})</th>
            </tr>
          </thead>
          <tbody>
            {coList.map(co => {
              const res = subject.surveyResponses.find(r => r.coCode === co);
              const calc = calculations[co];
              const level = calc?.attainmentLevel;

              return (
                <tr key={co} className="hover:bg-slate-50">
                  <td className="p-3 border border-black font-bold bg-slate-50 text-indigo-600 tabular-nums text-center w-24">{co}</td>
                  <td className="p-3 border border-black text-center tabular-nums">{res ? res.excellentCount : 0}</td>
                  <td className="p-3 border border-black text-center tabular-nums">{res ? res.satisfactoryCount : 0}</td>
                  <td className="p-3 border border-black text-center tabular-nums">{res ? res.averageCount : 0}</td>
                  <td className="p-3 border border-black text-center font-bold tabular-nums">{res ? res.totalParticipants : 0}</td>
                  <td className={`p-3 border border-black text-center font-extrabold tabular-nums ${level >= 2.5 ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-50 text-indigo-900'}`}>
                    {calc ? calc.attainmentLevel : 'NA'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-main text-subtle">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest">Formula Base:</span>
          <span className="text-xs font-medium italic">
            ROUNDUP((Excellent×3 + Satisfactory×2 + Average×1) / Total Responses, 1)
          </span>
        </div>
      </div>
    </div>
  );
}
