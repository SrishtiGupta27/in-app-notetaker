import { getReportUrl } from '../api/client';
import './ReportDownload.css';

function ReportDownload({ sessionId, filename }) {
  const handleDownload = () => {
    const url = getReportUrl(sessionId);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${sessionId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={handleDownload} className="btn-primary download-btn">
      📄 Download PDF Report
    </button>
  );
}

export default ReportDownload;
