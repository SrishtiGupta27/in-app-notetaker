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
    <div className="clinical-note-professional">
      {/* Header with Copy All */}
      <div className="clinical-header-professional">
        <div className="session-info">
          <h1>Clinical Note</h1>
          <p className="session-subtitle">AI-generated medical documentation</p>
        </div>
        <button 
          className="btn-copy-all-professional" 
          onClick={handleCopyAll}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          {copiedSection === 'all' ? 'Copied!' : 'Copy All'}
        </button>
      </div>

      {/* Clinical Sections */}
      <div className="clinical-sections-professional">
        <div className="clinical-section-professional">
          <div className="section-header-professional">
            <h3>Chief Complaint</h3>
            <button 
              className="btn-copy-section"
              onClick={() => handleCopySection(soap.chief_complaint, 'chief')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </button>
          </div>
          <div className="section-content-professional">
            {soap.chief_complaint ? (
              <p>{soap.chief_complaint}</p>
            ) : (
              <p className="empty-content-professional">Add content to this section</p>
            )}
          </div>
        </div>

        <div className="clinical-section-professional">
          <div className="section-header-professional">
            <h3>History of Present Illness</h3>
            <button 
              className="btn-copy-section"
              onClick={() => handleCopySection(soap.history_present_illness, 'history')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </button>
          </div>
          <div className="section-content-professional">
            {soap.history_present_illness ? (
              <p>{soap.history_present_illness}</p>
            ) : (
              <p className="empty-content-professional">Add content to this section</p>
            )}
          </div>
        </div>

        <div className="clinical-section-professional">
          <div className="section-header-professional">
            <h3>Assessment & Plan</h3>
            <button 
              className="btn-copy-section"
              onClick={() => handleCopySection(soap.assessment_plan, 'assessment')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </button>
          </div>
          <div className="section-content-professional">
            {soap.assessment_plan ? (
              <p>{soap.assessment_plan}</p>
            ) : (
              <p className="empty-content-professional">Add content to this section</p>
            )}
          </div>
        </div>

        {soap.review_systems && (
          <div className="clinical-section-professional">
            <div className="section-header-professional">
              <h3>Review of Systems</h3>
              <button 
                className="btn-copy-section"
                onClick={() => handleCopySection(soap.review_systems, 'review')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
            </div>
            <div className="section-content-professional">
              <p>{soap.review_systems}</p>
            </div>
          </div>
        )}

        {soap.recommended_labs && soap.recommended_labs.length > 0 && (
          <div className="clinical-section-professional labs-section-professional">
            <div className="section-header-professional">
              <h3>Recommended Lab Tests</h3>
            </div>
            <div className="labs-grid-professional">
              {soap.recommended_labs.map((lab, idx) => (
                <div key={idx} className="lab-card-professional">
                  <div className="lab-name-professional">{lab.test_name}</div>
                  <div className="lab-reason-professional">{lab.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClinicalNote;