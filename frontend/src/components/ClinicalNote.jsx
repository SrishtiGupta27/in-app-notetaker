import { useState } from 'react';
import './ClinicalNote.css';

function ClinicalNote({ soap }) {
  const [copiedSection, setCopiedSection] = useState(null);

  if (!soap) return null;

  const handleCopySection = (content, sectionName) => {
    navigator.clipboard.writeText(content);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyAll = () => {
    const allContent = `
Chief Complaint:
${soap.chief_complaint || 'N/A'}

History of Present Illness:
${soap.history_present_illness || 'N/A'}

Assessment & Plan:
${soap.assessment_plan || 'N/A'}

Review of Systems:
${soap.review_systems || 'N/A'}
    `.trim();
    
    navigator.clipboard.writeText(allContent);
    setCopiedSection('all');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="clinical-note">
      <div className="clinical-header">
        <button 
          className="btn-copy-all" 
          onClick={handleCopyAll}
        >
          {copiedSection === 'all' ? '✓ Copied' : '📋 Copy All'}
        </button>
      </div>

      <div className="clinical-sections">
        <div className="clinical-section">
          <div className="section-header-inline">
            <h4>Chief Complaint</h4>
            <button 
              className="btn-copy-small"
              onClick={() => handleCopySection(soap.chief_complaint, 'chief')}
            >
              {copiedSection === 'chief' ? '✓' : '📋'}
            </button>
          </div>
          <div className="section-content-editable">
            {soap.chief_complaint ? (
              <p>{soap.chief_complaint}</p>
            ) : (
              <p className="empty-content">Add content to this section</p>
            )}
          </div>
        </div>

        <div className="clinical-section">
          <div className="section-header-inline">
            <h4>History of Present Illness</h4>
            <button 
              className="btn-copy-small"
              onClick={() => handleCopySection(soap.history_present_illness, 'history')}
            >
              {copiedSection === 'history' ? '✓' : '📋'}
            </button>
          </div>
          <div className="section-content-editable">
            {soap.history_present_illness ? (
              <p>{soap.history_present_illness}</p>
            ) : (
              <p className="empty-content">Add content to this section</p>
            )}
          </div>
        </div>

        <div className="clinical-section">
          <div className="section-header-inline">
            <h4>Assessment & Plan</h4>
            <button 
              className="btn-copy-small"
              onClick={() => handleCopySection(soap.assessment_plan, 'assessment')}
            >
              {copiedSection === 'assessment' ? '✓' : '📋'}
            </button>
          </div>
          <div className="section-content-editable">
            {soap.assessment_plan ? (
              <p>{soap.assessment_plan}</p>
            ) : (
              <p className="empty-content">Add content to this section</p>
            )}
          </div>
        </div>

        {soap.review_systems && (
          <div className="clinical-section">
            <div className="section-header-inline">
              <h4>Review of Systems</h4>
              <button 
                className="btn-copy-small"
                onClick={() => handleCopySection(soap.review_systems, 'review')}
              >
                {copiedSection === 'review' ? '✓' : '📋'}
              </button>
            </div>
            <div className="section-content-editable">
              <p>{soap.review_systems}</p>
            </div>
          </div>
        )}

        {soap.recommended_labs && soap.recommended_labs.length > 0 && (
          <div className="clinical-section labs-section">
            <div className="section-header-inline">
              <h4>🧪 Recommended Lab Tests</h4>
            </div>
            <div className="labs-grid">
              {soap.recommended_labs.map((lab, idx) => (
                <div key={idx} className="lab-card">
                  <div className="lab-name">{lab.test_name}</div>
                  <div className="lab-reason">{lab.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="quality-feedback">
        <p>How was the quality of the generated note?</p>
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} className="star-btn">⭐</button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClinicalNote;
