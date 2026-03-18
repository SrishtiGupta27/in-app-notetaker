import { useMemo } from 'react';
import './Noteworthy.css';

function Noteworthy({ soap }) {
  const extractedData = useMemo(() => {
    if (!soap) return { conditions: [], medications: [], procedures: [] };

    const conditions = [];
    const medications = [];
    const procedures = [];

    // Extract from assessment_plan
    const assessmentText = soap.assessment_plan || '';
    const historyText = soap.history_present_illness || '';
    const combinedText = `${assessmentText} ${historyText}`.toLowerCase();

    // Common medical conditions
    const conditionKeywords = [
      'diabetes', 'hypertension', 'chest pain', 'shortness of breath',
      'heart disease', 'heart attack', 'stroke', 'infection', 'fever',
      'headache', 'migraine', 'asthma', 'copd', 'pneumonia', 'bronchitis',
      'gastritis', 'ulcer', 'arthritis', 'fracture', 'sprain', 'anxiety',
      'depression', 'insomnia', 'obesity', 'anemia', 'thyroid', 'cancer',
      'covid', 'flu', 'cold', 'allergy', 'eczema', 'dermatitis', 'angina',
      'arrhythmia', 'tachycardia', 'bradycardia', 'hyperlipidemia',
      'hypercholesterolemia', 'gout', 'kidney disease', 'liver disease',
      'pancreatitis', 'colitis', 'ibs', 'crohn', 'celiac', 'osteoporosis'
    ];

    // Common medications
    const medicationKeywords = [
      'metformin', 'insulin', 'aspirin', 'ibuprofen', 'acetaminophen',
      'lisinopril', 'amlodipine', 'atorvastatin', 'simvastatin', 'losartan',
      'omeprazole', 'pantoprazole', 'levothyroxine', 'albuterol', 'prednisone',
      'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline',
      'gabapentin', 'tramadol', 'hydrocodone', 'oxycodone', 'morphine',
      'warfarin', 'clopidogrel', 'furosemide', 'hydrochlorothiazide',
      'sertraline', 'fluoxetine', 'escitalopram', 'alprazolam', 'lorazepam',
      'zolpidem', 'trazodone', 'montelukast', 'cetirizine', 'loratadine'
    ];

    // Common procedures
    const procedureKeywords = [
      'ecg', 'ekg', 'x-ray', 'ct scan', 'mri', 'ultrasound', 'blood test',
      'urine test', 'biopsy', 'endoscopy', 'colonoscopy', 'mammogram',
      'physical examination', 'vital signs', 'blood pressure', 'surgery',
      'injection', 'vaccination', 'immunization', 'dialysis', 'chemotherapy',
      'radiation', 'physical therapy', 'occupational therapy', 'counseling'
    ];

    // Extract conditions
    conditionKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        const formatted = keyword.split(' ').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
        if (!conditions.includes(formatted)) {
          conditions.push(formatted);
        }
      }
    });

    // Extract medications
    medicationKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        const formatted = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        if (!medications.includes(formatted)) {
          medications.push(formatted);
        }
      }
    });

    // Extract procedures
    procedureKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        const formatted = keyword.split(' ').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
        if (!procedures.includes(formatted)) {
          procedures.push(formatted);
        }
      }
    });

    // Also extract from recommended_labs
    if (soap.recommended_labs && Array.isArray(soap.recommended_labs)) {
      soap.recommended_labs.forEach(lab => {
        const testName = lab.test_name;
        if (testName && !procedures.includes(testName)) {
          procedures.push(testName);
        }
      });
    }

    return { conditions, medications, procedures };
  }, [soap]);

  if (!soap) return null;

  return (
    <div className="noteworthy">
      <div className="noteworthy-header">
        <h3>Noteworthy</h3>
        <span className="info-icon">ⓘ</span>
      </div>

      <div className="noteworthy-section">
        <h4>Conditions</h4>
        <div className="keyword-tags">
          {extractedData.conditions.length > 0 ? (
            extractedData.conditions.map((condition, idx) => (
              <span key={idx} className="keyword-tag condition-tag">
                {condition}
              </span>
            ))
          ) : (
            <p className="no-data">No conditions identified</p>
          )}
        </div>
      </div>

      <div className="noteworthy-section">
        <h4>Medications</h4>
        <div className="keyword-tags">
          {extractedData.medications.length > 0 ? (
            extractedData.medications.map((med, idx) => (
              <span key={idx} className="keyword-tag medication-tag">
                {med}
              </span>
            ))
          ) : (
            <p className="no-data">No medications mentioned</p>
          )}
        </div>
      </div>

      <div className="noteworthy-section">
        <h4>Procedures</h4>
        <div className="keyword-tags">
          {extractedData.procedures.length > 0 ? (
            extractedData.procedures.map((proc, idx) => (
              <span key={idx} className="keyword-tag procedure-tag">
                {proc}
              </span>
            ))
          ) : (
            <p className="no-data">No procedures mentioned</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Noteworthy;
