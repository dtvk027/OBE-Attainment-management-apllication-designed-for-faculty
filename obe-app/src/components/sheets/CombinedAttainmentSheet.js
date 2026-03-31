import React from 'react';

export default function CombinedAttainmentSheet({ subject, calculations }) {
  const template = subject.template;
  const coList = Array.from({ length: template.coCount }, (_, i) => `CO${i + 1}`);

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-main">Combined CO Attainment</h2>
        <p className="text-sm text-subtle mt-1">Weighted average of direct and indirect assessment data.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-8 max-w-2xl">
        <div className="card p-5 bg-white">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">Direct Weightage</span>
          <div className="text-2xl font-bold text-main mt-1">{(template.directWeightage * 100).toFixed(0)}%</div>
        </div>
        <div className="card p-5 bg-white">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">Indirect Weightage</span>
          <div className="text-2xl font-bold text-main mt-1">{(template.indirectWeightage * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="overflow-x-auto border border-black">
        <table className="w-full border-collapse text-[12px] font-sans bg-white">
          <thead>
            <tr className="bg-[#00BFEE] text-white font-bold uppercase tracking-tight text-center">
              <th className="p-3 border border-black text-left">Course Outcome</th>
              <th className="p-3 border border-black">Direct Attainment Level</th>
              <th className="p-3 border border-black">Indirect Attainment Level</th>
              <th className="p-3 border border-black bg-[#FFFF00] text-black">Total Attainment Level</th>
            </tr>
          </thead>
          <tbody>
            {coList.map(co => {
              const calc = calculations[co];
              const level = calc?.attainmentLevel;
              return (
                <tr key={co} className="hover:bg-slate-50">
                  <td className="p-3 border border-black font-bold bg-slate-50 text-indigo-600 tabular-nums text-center w-32">{co}</td>
                  <td className="p-3 border border-black text-center font-medium tabular-nums">{calc ? calc.direct : 'NA'}</td>
                  <td className="p-3 border border-black text-center font-medium tabular-nums">{calc ? calc.indirect : 'NA'}</td>
                  <td className={`p-3 border border-black text-center font-extrabold tabular-nums ${level >= 2.5 ? 'bg-emerald-100 text-emerald-800' : level >= 1.5 ? 'bg-yellow-50 text-indigo-900 text-lg' : 'bg-red-50 text-black'}`}>
                    {calc ? calc.attainmentLevel : 'NA'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-main">
        <div className="flex items-center gap-3 text-subtle">
          <span className="text-xs font-bold uppercase tracking-widest">Calculation Methodology:</span>
          <span className="text-xs font-medium italic">
            Direct Attainment × {template.directWeightage} + Indirect Attainment × {template.indirectWeightage}
          </span>
        </div>
      </div>
    </div>
  );
}
