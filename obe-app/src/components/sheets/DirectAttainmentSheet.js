import React, { useState } from 'react';
import AttainmentSummary from '@/components/AttainmentSummary';

/**
 * DirectAttainmentSheet: Overhauled to strictly match the Excel-style layout
 * from the user's reference image with Cyan/Blue highlights and professional borders.
 */
export default function DirectAttainmentSheet({ subject, calculations, onDataChange, isAdmin }) {
  const [editing, setEditing] = useState(null); 
  const [editValue, setEditValue] = useState('');
  
  const template = subject.template;
  const groups = typeof template.assessmentGroups === 'string' 
    ? JSON.parse(template.assessmentGroups) 
    : template.assessmentGroups;

  const coCount = template.coCount || 5;
  const coList = Array.from({length: coCount}, (_, i) => `CO${i+1}`);

  const handleEditInit = (student, col, currentVal) => {
    setEditing({ 
      stuId: student.id, 
      assessId: col.assessId, 
      co: col.co, 
      max: calculations.columnMaxMarks[col.type === 'internal' ? 'internal' : 'endSem'][col.co] 
    });
    setEditValue(currentVal === null ? '' : currentVal);
  };

  const handleSave = async (studentId, assessId, co, maxMark) => {
    try {
      if (editValue.trim() !== '') {
        const val = parseFloat(editValue);
        await fetch(`/api/subjects/${subject.id}/marks`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, assessmentId: assessId, coCode: co, marksObtained: val, maxMarks: maxMark })
        });
        onDataChange();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditing(null);
    }
  };

  const isEditing = (stuId, assessId, co) => {
    return editing && editing.stuId === stuId && editing.assessId === assessId && editing.co === co;
  };

  // Helper calculating target (60% of Max)
  const getTarget = (max) => (max * (template.targetPercentage / 100)).toFixed(1);

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6 px-4">
        <div>
          <h2 className="text-xl font-bold text-main">Direct Attainment</h2>
          <p className="text-sm text-subtle mt-1">Mirroring original Excel attainment format.</p>
        </div>
      </div>
      
      <div className="overflow-x-auto w-full px-4 pb-8">
        <table className="min-w-full border-collapse border border-black text-[11px] leading-tight font-sans">
          <thead>
            {/* TIER 1: CORE SEGMENTS */}
            <tr className="bg-white text-center font-bold">
              <th colSpan={2} rowSpan={1} className="border border-black bg-white"></th>
              <th colSpan={groups.internal.reduce((sum, g) => sum + g.co_columns.length, 0) + coCount + 1} className="border border-black bg-[#00BFEE] py-2 uppercase tracking-wide text-white">
                Internal Assesment
              </th>
              <th colSpan={groups.end_semester.co_columns.length + 1} className="border border-black bg-[#ADD8E6] py-2 uppercase tracking-wide">
                End Semester Assesment
              </th>
              <th colSpan={coCount + 1} className="border border-black bg-[#60A5FA] py-2 uppercase tracking-wide text-white">
                Semester Final Assessment
              </th>
            </tr>

            {/* TIER 2: ASSESSMENT GROUPS & TOTALS */}
            <tr className="bg-[#E5F1FF] text-center font-bold">
              <th rowSpan={2} className="border border-black sticky left-0 z-20 bg-[#E5F1FF] min-w-[120px]">Regd.No</th>
              <th rowSpan={2} className="border border-black min-w-[200px]">Name</th>
              {groups.internal.map(g => (
                <th key={g.id} colSpan={g.co_columns.length} className="border border-black py-2">
                  {g.label}
                </th>
              ))}
              <th colSpan={coCount} className="border border-black bg-[#FFFF00] py-2">
                Internal CO Wise Total
              </th>
              <th className="border border-black bg-[#90EE90] py-2 whitespace-nowrap">InSem Total</th>
              <th colSpan={groups.end_semester.co_columns.length} className="border border-black bg-[#ADD8E6] py-2">
                End Examination CO Wise
              </th>
              <th className="border border-black bg-[#FFFF00] py-2 font-black whitespace-nowrap text-xs">End Exam Total</th>
              <th colSpan={coCount} className="border border-black bg-[#60A5FA] text-white py-2">
                In and End Semester CO Wise
              </th>
              <th className="border border-black bg-[#FFFF00] py-2 font-black">Exam Total</th>
            </tr>

            {/* TIER 3: CO LABELS */}
            <tr className="bg-[#F8FAFC] text-center font-bold text-[9px]">
              {/* Internal Assessments */}
              {groups.internal.flatMap(g => g.co_columns).map((co, i) => (
                <th key={`int_co_head_${i}`} className="border border-black py-1 px-1">{co}</th>
              ))}
              {/* Internal Totals */}
              {coList.map((co, i) => (
                <th key={`int_total_head_${i}`} className="border border-black py-1 px-1 bg-yellow-100">{co}</th>
              ))}
              <th className="border border-black bg-[#90EE90]">70</th>

              {/* End Exam CO Wise */}
              {groups.end_semester.co_columns.map((co, i) => (
                <th key={`end_exam_head_${i}`} className="border border-black py-1 px-1">{co}</th>
              ))}
              <th className="border border-black bg-yellow-100">30</th>

              {/* Final Selection */}
              {coList.map((co, i) => (
                <th key={`final_co_head_${i}`} className="border border-black py-1 px-1 bg-blue-50">{co}</th>
              ))}
              <th className="border border-black bg-yellow-400">100</th>
            </tr>
          </thead>

          <tbody>
            {/* ROW 4: MAXIMUM MARKS */}
            <tr className="bg-[#F1F5F9] text-center font-bold">
              <td className="border border-black sticky left-0 z-10 bg-[#F1F5F9] py-1">Maximum marks</td>
              <td className="border border-black">Full Class Target</td>
              {groups.internal.flatMap(g => g.co_columns.map(co => ({ gId: g.id, co }))).map((col, i) => (
                <td key={`max_raw_${i}`} className="border border-black">
                  {calculations.columnMaxMarks.internal_raw?.[`${col.gId}_${col.co}`] || '-'}
                </td>
              ))}
              {coList.map((co, i) => (
                <td key={`max_int_sum_${i}`} className="border border-black bg-[#FFFF00]">
                  {calculations.columnMaxMarks.internal[co] || 0}
                </td>
              ))}
              <td className="border border-black bg-[#90EE90]">
                {Object.values(calculations.columnMaxMarks.internal).reduce((a, b) => a + b, 0)}
              </td>
              {groups.end_semester.co_columns.map((co, i) => (
                <td key={`max_end_raw_${i}`} className="border border-black">
                  {calculations.columnMaxMarks.endSem[co] || '-'}
                </td>
              ))}
              <td className="border border-black bg-[#FFFF00]">
                {Object.values(calculations.columnMaxMarks.endSem).reduce((a, b) => a + b, 0)}
              </td>
              {coList.map((co, i) => (
                <td key={`max_comb_sum_${i}`} className="border border-black bg-blue-100 font-bold text-blue-900">
                  {calculations.columnMaxMarks.combined[co] || 0}
                </td>
              ))}
              <td className="border border-black bg-yellow-500 text-white">100</td>
            </tr>

            {/* ROW 5: TARGET (60%) */}
            <tr className="bg-[#90EE90] text-center font-bold text-[10px]">
              <td className="border border-black sticky left-0 z-10 bg-[#90EE90] py-1">Target({template.targetPercentage}%)</td>
              <td className="border border-black">Min. Requirement</td>
              {groups.internal.flatMap(g => g.co_columns.map(co => ({ gId: g.id, co }))).map((col, i) => (
                <td key={`trg_raw_${i}`} className="border border-black text-black/60">
                  {getTarget(calculations.columnMaxMarks.internal_raw?.[`${col.gId}_${col.co}`] || 0)}
                </td>
              ))}
              {coList.map((co, i) => (
                <td key={`trg_int_sum_${i}`} className="border border-black">
                  {getTarget(calculations.columnMaxMarks.internal[co] || 0)}
                </td>
              ))}
              <td className="border border-black">
                {getTarget(Object.values(calculations.columnMaxMarks.internal).reduce((a, b) => a + b, 0))}
              </td>
              {groups.end_semester.co_columns.map((co, i) => (
                <td key={`trg_end_raw_${i}`} className="border border-black">
                  {getTarget(calculations.columnMaxMarks.endSem[co] || 0)}
                </td>
              ))}
              <td className="border border-black">
                {getTarget(Object.values(calculations.columnMaxMarks.endSem).reduce((a, b) => a + b, 0))}
              </td>
              {coList.map((co, i) => (
                <td key={`trg_comb_sum_${i}`} className="border border-black">
                  {getTarget(calculations.columnMaxMarks.combined[co] || 0)}
                </td>
              ))}
              <td className="border border-black">60</td>
            </tr>

            {/* DATA ROWS */}
            {calculations.studentResults.map((student) => {
              const origStudent = subject.students.find(s => s.id === student.id);
              
              return (
                <tr key={student.id} className="hover:bg-slate-50 even:bg-slate-50/20">
                  <td className="border border-black sticky left-0 z-10 bg-white px-2 py-1.5 font-bold tabular-nums">
                    {student.regNumber}
                  </td>
                  <td className="border border-black px-2 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                    {origStudent?.name || '-'}
                  </td>
                  
                  {/* 1. Internal Raw Columns */}
                  {groups.internal.flatMap(g => g.co_columns.map(co => ({ g, co }))).map((col, i) => {
                    const rawMarkObj = origStudent?.marks.find(m => 
                      m.assessmentId && 
                      m.assessmentId.toLowerCase().trim() === col.g.id.toLowerCase().trim() && 
                      m.coCode === col.co
                    );
                    const rawVal = rawMarkObj ? rawMarkObj.marksObtained : null;
                    const maxVal = rawMarkObj ? rawMarkObj.maxMarks : 0;
                    
                    return (
                      <td 
                        key={`int_raw_cell_${student.id}_${i}`} 
                        className={`border border-black text-center p-0 ${!isAdmin ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default'}`}
                        onClick={() => !isAdmin && !isEditing(student.id, col.g.id, col.co) && handleEditInit(student, { ...col, assessId: col.g.id, type: 'internal' }, rawVal)}
                      >
                        {isEditing(student.id, col.g.id, col.co) ? (
                          <input autoFocus type="number" step="0.01" 
                            className="w-full h-full text-center border-none focus:ring-0 bg-blue-50 m-0 p-1"
                            value={editValue} onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleSave(student.id, col.g.id, col.co, maxVal)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave(student.id, col.g.id, col.co, maxVal)}
                          />
                        ) : (
                          <span className="block py-1.5 tabular-nums">{rawVal !== null ? rawVal : ''}</span>
                        )}
                      </td>
                    );
                  })}

                  {/* 2. Internal Totals */}
                  {coList.map((co, i) => (
                    <td key={`comp_int_${student.id}_${i}`} className="border border-black text-center bg-yellow-200/50 font-bold">
                      {student.internal[co] !== undefined ? student.internal[co] : ''}
                    </td>
                  ))}
                  
                  <td className="border border-black text-center font-bold bg-[#E5F1FF]">
                    {student.inSemTotal}
                  </td>

                  {/* 3. End Semester Raw Columns */}
                  {groups.end_semester.co_columns.map((co, i) => {
                    const endSemId = groups.end_semester.id;
                    const rawMarkObj = origStudent?.marks.find(m => 
                      m.assessmentId && 
                      m.assessmentId.toLowerCase().trim() === endSemId.toLowerCase().trim() && 
                      m.coCode === co
                    );
                    const rawVal = rawMarkObj ? rawMarkObj.marksObtained : null;
                    const maxVal = rawMarkObj ? rawMarkObj.maxMarks : 0;

                    return (
                      <td 
                        key={`end_raw_cell_${student.id}_${i}`} 
                        className={`border border-black text-center p-0 ${!isAdmin ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default'}`}
                        onClick={() => !isAdmin && !isEditing(student.id, endSemId, co) && handleEditInit(student, { co, assessId: endSemId, type: 'endSem' }, rawVal)}
                      >
                        {isEditing(student.id, endSemId, co) ? (
                          <input autoFocus type="number" step="0.01" 
                            className="w-full h-full text-center border-none focus:ring-0 bg-blue-50 m-0 p-1"
                            value={editValue} onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleSave(student.id, endSemId, co, maxVal)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave(student.id, endSemId, co, maxVal)}
                          />
                        ) : (
                          <span className="block py-1.5 tabular-nums">{rawVal !== null ? rawVal : ''}</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="border border-black text-center font-bold bg-yellow-200">
                    {student.endExamTotal}
                  </td>

                  {/* 4. Combined Totals */}
                  {coList.map((co, i) => (
                    <td key={`comp_comb_${student.id}_${i}`} className="border border-black text-center bg-blue-50 font-bold">
                      {student.combined[co] !== undefined ? student.combined[co] : ''}
                    </td>
                  ))}
                  
                  <td className="border border-black text-center font-extrabold bg-[#FFFF00] tabular-nums">
                    {student.finalTotal.toFixed(0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 px-4">
        <AttainmentSummary 
          summary={calculations.summary} 
          coCount={template.coCount} 
        />
      </div>
    </div>
  );
}
