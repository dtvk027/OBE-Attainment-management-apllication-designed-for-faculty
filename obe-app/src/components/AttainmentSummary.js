import React from 'react';

/**
 * Renders the final attainment summary tables as seen in the Excel ground truth.
 * @param {Object} summary - The summary data containing internal, endSem, and combined attainment.
 * @param {Number} coCount - The count of Course Outcomes.
 */
export default function AttainmentSummary({ summary, coCount }) {
  const coList = Array.from({ length: coCount }, (_, i) => `CO${i + 1}`);

  const Table = ({ title, colorCode, data, marksLabel }) => (
    <div style={{ marginBottom: '3rem', overflowX: 'auto' }}>
      <h3 style={{ 
        backgroundColor: colorCode, 
        color: '#0f172a', 
        padding: '0.75rem 1rem', 
        fontSize: '1rem', 
        fontWeight: 700,
        margin: 0,
        border: '1px solid #cbd5e1',
        borderBottom: 'none'
      }}>
        {title}
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th style={styles.th}>CO / Evaluation Parameters</th>
            {coList.map(co => (
              <th key={co} style={{ ...styles.th, textAlign: 'center', width: '100px' }}>{co}</th>
            ))}
            <th style={{ ...styles.th, textAlign: 'center', width: '100px', background: '#f8fafc' }}>All COs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={styles.td}>{marksLabel}</td>
            {coList.map(co => (
              <td key={co} style={{ ...styles.td, textAlign: 'center' }}>
                {data[co]?.maxMark || 0}
              </td>
            ))}
            <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f1f5f9' }}>-</td>
          </tr>
          <tr>
            <td style={styles.td}>No. of Students Attempted the Question</td>
            {coList.map(co => (
              <td key={co} style={{ ...styles.td, textAlign: 'center' }}>
                {data[co]?.attempted || 0}
              </td>
            ))}
            <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f1f5f9' }}>-</td>
          </tr>
          <tr>
            <td style={styles.td}>No. of Students Scored more than Target (60%)</td>
            {coList.map(co => (
              <td key={co} style={{ ...styles.td, textAlign: 'center' }}>
                {data[co]?.targetMet || 0}
              </td>
            ))}
            <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f1f5f9' }}>-</td>
          </tr>
          <tr style={{ fontWeight: 700, backgroundColor: '#f1f5f9' }}>
            <td style={styles.td}>% of Attainment</td>
            {coList.map(co => (
              <td key={co} style={{ ...styles.td, textAlign: 'center' }}>
                {data[co]?.percentage || 0}%
              </td>
            ))}
            <td style={{ ...styles.td, textAlign: 'center' }}>
              {(Object.values(data).reduce((sum, v) => sum + (v.percentage || 0), 0) / coCount).toFixed(2)}%
            </td>
          </tr>
          <tr style={{ fontWeight: 800, color: 'var(--primary)', backgroundColor: '#fffbeb', border: '2px solid #fbbf24' }}>
            <td style={styles.td}>Attainment Level</td>
            {coList.map(co => (
              <td key={co} style={{ ...styles.td, textAlign: 'center' }}>
                {data[co]?.level === 'NA' ? 'NA' : data[co]?.level}
              </td>
            ))}
            <td style={{ ...styles.td, textAlign: 'center' }}>
                {(() => {
                    const validLevels = Object.values(data).filter(v => typeof v.level === 'number');
                    if (validLevels.length === 0) return 'NA';
                    return (validLevels.reduce((sum, v) => sum + v.level, 0) / validLevels.length).toFixed(1);
                })()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ marginTop: '4rem', padding: '1rem', borderTop: '2px solid #e2e8f0' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
        Final Attainment Summary
      </h2>
      
      <Table 
        title="INTERNAL ASSESSMENT OF COs FOR THE COURSE" 
        colorCode="#dcfce7" // Green
        data={summary.internal} 
        marksLabel="In Sem Exams (70 Marks)"
      />

      <Table 
        title="END SEMESTER ASSESSMENT OF COs FOR THE COURSE" 
        colorCode="#f3e8ff" // Purple
        data={summary.endSem} 
        marksLabel="Sem End Examination (30 Marks)"
      />

      <Table 
        title="INTERNAL & END SEMESTER ASSESSMENT OF COs FOR THE COURSE" 
        colorCode="#fef9c3" // Yellow
        data={summary.combined} 
        marksLabel="In and Sem End Exam (100 Marks)"
      />
    </div>
  );
}

const styles = {
  th: {
    padding: '0.75rem',
    border: '1px solid #cbd5e1',
    color: '#334155',
    fontWeight: 700,
    textAlign: 'left'
  },
  td: {
    padding: '0.75rem',
    border: '1px solid #cbd5e1',
    color: '#0f172a'
  }
};
