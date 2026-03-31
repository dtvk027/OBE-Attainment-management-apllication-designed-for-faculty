import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export default function POPSOAttainmentSheet({ subject, calculations, onDataChange, isAdmin }) {
  const template = subject.template;
  const { poCount, psoCount, coCount } = template;

  const poList = Array.from({ length: poCount }, (_, i) => `PO${i + 1}`);
  const psoList = Array.from({ length: psoCount }, (_, i) => `PSO${i + 1}`);
  const allPos = [...poList, ...psoList];
  
  const coList = Array.from({ length: coCount }, (_, i) => `CO${i + 1}`);

  const articulationStats = calculations.articulationStats || {};
  const attainment = calculations.attainment || {};

  const [mappings, setMappings] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initial = {};
    if (subject.coPOMappings) {
      subject.coPOMappings.forEach(m => {
        initial[`${m.coCode}_${m.poCode}`] = m.mappingValue;
      });
    }
    setMappings(initial);
  }, [subject.coPOMappings]);

  const handleMappingChange = (co, po, val) => {
    setMappings(prev => ({
      ...prev,
      [`${co}_${po}`]: val ? parseInt(val) : ''
    }));
  };

  const saveMappings = async () => {
    setLoading(true);
    const payload = [];
    Object.entries(mappings).forEach(([key, val]) => {
      if (val) {
        const [coCode, poCode] = key.split('_');
        payload.push({ coCode, poCode, mappingValue: val });
      }
    });

    try {
      const res = await fetch(`/api/subjects/${subject.id}/po-mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings: payload })
      });
      if (!res.ok) throw new Error("Failed to save mappings");
      if (onDataChange) onDataChange();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-10">
        <h2 className="text-xl font-bold text-main">PO-PSO Attainment</h2>
        <p className="text-sm text-subtle mt-1">Mapping Course Outcomes to Program Outcomes and Specific Outcomes.</p>
      </div>

      {/* Articulation Matrix */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 border-b-2 border-zinc-900 pb-2">1. Articulation Matrix (Mapping)</h3>
          {!isAdmin && (
            <button 
              onClick={saveMappings} 
              disabled={loading}
              className="flex items-center gap-2 bg-[#00BFEE] hover:bg-[#009FCC] text-white px-4 py-2 rounded font-bold shadow-sm transition-all text-xs uppercase"
            >
              {loading ? 'Saving...' : <><Save size={14} /> Save Mappings</>}
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto border border-black shadow-sm">
          <table className="w-full border-collapse text-[11px] font-sans bg-white">
            <thead>
              <tr className="bg-[#00BFEE] text-white font-bold uppercase tracking-tight text-center">
                <th rowSpan={2} className="p-3 border border-black text-left w-32 bg-slate-100 text-zinc-800">Subject / CO</th>
                <th colSpan={poCount} className="p-2 border border-black bg-[#00BFEE] text-white tracking-widest">Program Outcomes (POs)</th>
                <th colSpan={psoCount} className="p-2 border border-black bg-[#ADD8E6] text-black tracking-widest">PSOs</th>
              </tr>
              <tr className="bg-slate-50 text-zinc-700 font-black">
                {poList.map(po => <th key={po} className="p-2 border border-black text-center min-w-[45px]">{po.replace('PO', '')}</th>)}
                {psoList.map(pso => <th key={pso} className="p-2 border border-black text-center min-w-[45px] font-black">{pso.replace('PSO', '')}</th>)}
              </tr>
            </thead>
            <tbody>
              {coList.map((co) => (
                <tr key={`map_${co}`} className="hover:bg-cyan-50/30">
                  <td className="p-3 border border-black font-extrabold bg-slate-50 text-indigo-600 text-center">{co}</td>
                  {allPos.map(po => {
                    const key = `${co}_${po}`;
                    const val = mappings[key] || '';
                    return (
                      <td key={`val_${co}_${po}`} className="p-0 border border-black text-center">
                        <select 
                          value={val} 
                          onChange={(e) => handleMappingChange(co, po, e.target.value)}
                          disabled={isAdmin}
                          className={`w-full h-full py-2 px-1 border-none bg-transparent text-center focus:ring-0 appearance-none font-bold text-zinc-800 ${isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <option value=""></option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              <tr className="bg-slate-100 font-bold italic text-zinc-600">
                <td className="p-2 border border-black text-right px-4">Sum</td>
                {allPos.map(po => (
                  <td key={`sum_${po}`} className="p-2 border border-black text-center tabular-nums">{articulationStats[po]?.sum || 0}</td>
                ))}
              </tr>
              <tr className="bg-slate-100 font-bold italic text-zinc-600">
                <td className="p-2 border border-black text-right px-4">Count</td>
                {allPos.map(po => (
                  <td key={`cnt_${po}`} className="p-2 border border-black text-center tabular-nums">{articulationStats[po]?.count || 0}</td>
                ))}
              </tr>
              <tr className="bg-yellow-400 text-black font-black">
                <td className="p-3 border border-black text-right px-4 uppercase tracking-tighter">Average Mapping</td>
                {allPos.map(po => (
                  <td key={`avg_${po}`} className="p-2 border border-black text-center text-[13px] tabular-nums">{articulationStats[po]?.average || 0}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Attainment Summary */}
      <section>
        <h3 className="text-sm font-black uppercase tracking-widest text-[#00BFEE] border-b-2 border-[#00BFEE] pb-2 mb-6">2. PO-PSO Attainment Summary</h3>
        
        <div className="overflow-x-auto border border-black shadow-sm">
          <table className="w-full border-collapse text-[11px] font-sans bg-white">
            <thead>
              <tr className="bg-[#00BFEE] text-white font-bold uppercase tracking-tight text-center">
                <th className="p-3 border border-black text-left w-32 bg-slate-100 text-zinc-800">Course Outcome</th>
                {allPos.map(po => (
                  <th key={po} className="p-3 border border-black">
                    {po.replace('PO', 'PO-').replace('PSO', 'PSO-')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coList.map((co) => (
                <tr key={`att_${co}`} className="hover:bg-slate-50">
                  <td className="p-3 border border-black font-extrabold bg-slate-50 text-indigo-600 text-center">{co}</td>
                  {allPos.map(po => {
                    const contInfo = attainment[po]?.coContributions?.[co];
                    return (
                      <td key={`attval_${co}_${po}`} className={`p-3 border border-black text-center tabular-nums ${contInfo === null ? 'text-zinc-300 italic' : 'font-bold text-zinc-700'}`}>
                        {contInfo === null ? '-' : contInfo}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-[#FFFF00] text-black font-black">
                <td className="p-4 border border-black text-right px-6 font-extrabold uppercase tracking-tight text-[12px]">Total Level Attainment</td>
                {allPos.map(po => (
                  <td key={`tot_${po}`} className="p-2 border border-black text-center font-black text-[15px] tabular-nums">
                    {attainment[po]?.total || 0}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-main text-subtle">
           <div className="flex items-center gap-3">
             <span className="text-xs font-bold uppercase tracking-widest">Formula Base:</span>
             <span className="text-xs font-medium italic">
               ROUND(co_total_attainment * mapping_value / sum_of_mapping, 2)
             </span>
           </div>
        </div>
      </section>
    </div>
  );
}
