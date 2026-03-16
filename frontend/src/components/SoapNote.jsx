import './SoapNote.css';

function SoapNote({ soap }) {
  if (!soap) return null;

  const sections = [
    { key: 'subjective', label: 'S — Subjective', color: '#3498db' },
    { key: 'objective', label: 'O — Objective', color: '#9b59b6' },
    { key: 'assessment', label: 'A — Assessment', color: '#e67e22' },
    { key: 'plan', label: 'P — Plan', color: '#27ae60' }
  ];

  return (
    <div className="soap-note">
      <h2>SOAP Note</h2>
      <p className="soap-subtitle">AI-generated clinical documentation</p>

      <div className="soap-grid">
        {sections.map(({ key, label, color }) => (
          <div key={key} className="soap-section">
            <div className="soap-header" style={{ background: color }}>
              {label}
            </div>
            <div className="soap-content">
              {soap[key] ? (
                <p>{soap[key]}</p>
              ) : (
                <p className="soap-empty">No {key} information available</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SoapNote;
