'use client';

import React, { useState } from 'react';

/**
 * Basic Modal Component for Import Dialog
 */
export default function ImportDialog({ subject, onImportSuccess, onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // single_assessment properties
  const [stage, setStage] = useState('upload'); // 'upload' | 'mapping'
  const [previewData, setPreviewData] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [selectedCOs, setSelectedCOs] = useState([]);

  // Extract from template
  const template = subject.template;
  const groups = typeof template.assessmentGroups === 'string' 
    ? JSON.parse(template.assessmentGroups) 
    : template.assessmentGroups;
  
  const assessments = [
    ...groups.internal.map(g => ({ id: g.id, label: g.label, type: 'internal' })),
    { id: groups.end_semester.id, label: groups.end_semester.label, type: 'endSem' }
  ];

  const coList = Array.from({ length: template.coCount }, (_, i) => `CO${i + 1}`);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`/api/subjects/${subject.id}/import`, {
        method: 'POST',
        body: formData // Note: FormData does not need Content-Type header, it gets added automatically
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      if (data.type === 'single_assessment_preview') {
        // Needs mapping
        setPreviewData(data.previewData);
        setStage('mapping');
      } else {
        // Success (Full Workbook)
        onImportSuccess(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssessmentId || selectedCOs.length === 0) {
      setError("Please select an assessment and at least one Course Outcome");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const mapping = {
        assessmentId: selectedAssessmentId,
        coCodes: selectedCOs
      };

      const formData = new FormData();
      // Important trick: We need to re-upload the file so the server can parse it WITH the mapping.
      // Another approach is just having an endpoint that takes JSON data and mapping, but re-uploading the file is fine for this demo.
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      
      const res = await fetch(`/api/subjects/${subject.id}/import`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Import failed during mapping phase');
      }

      onImportSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCO = (co) => {
    setSelectedCOs(prev => prev.includes(co) ? prev.filter(c => c !== co) : [...prev, co]);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: 8, width: '100%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Import Assessment Data</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', outline: 'none' }}>&times;</button>
        </div>
        
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        {stage === 'upload' && (
          <form onSubmit={handleFileUpload}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Upload a Full OBE Workbook or a single assessment file (e.g. Quiz-2.xlsx exported from portal). 
            </p>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <input 
                type="file" 
                accept=".xls,.xlsx" 
                onChange={e => setFile(e.target.files[0])}
                style={{ padding: '0.5rem 0' }}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn-primary" style={{ background: '#e2e8f0', color: '#0f172a' }} disabled={loading}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={!file || loading}>
                {loading ? 'Uploading...' : 'Upload Data'}
              </button>
            </div>
          </form>
        )}

        {stage === 'mapping' && (
          <form onSubmit={handleMappingSubmit}>
            <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
              File parsed successfully. {previewData.length} records found.
            </div>
            
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Select Assessment Group</p>
            <div className="form-group">
              <select 
                value={selectedAssessmentId} 
                onChange={e => setSelectedAssessmentId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid var(--border-color)', outline: 'none' }}
                disabled={loading}
              >
                <option value="">-- Choose Assessment --</option>
                {assessments.map(a => (
                  <option key={a.id} value={a.id}>{a.label} ({a.type})</option>
                ))}
              </select>
            </div>

            <p style={{ fontWeight: 600, marginBottom: '0.5rem', marginTop: '1rem' }}>Map to Course Outcomes</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {coList.map(co => (
                <label key={co} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedCOs.includes(co)} 
                    onChange={() => toggleCO(co)} 
                    disabled={loading}
                  />
                  {co}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setStage('upload')} className="btn-primary" style={{ background: '#e2e8f0', color: '#0f172a' }} disabled={loading}>Back</button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={loading}>
                {loading ? 'Importing...' : 'Save Data'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
