from openai import OpenAI
from typing import List, Dict
from app.config import settings

client = OpenAI(api_key=settings.openai_api_key)

SOAP_PROMPT = """You are an experienced medical scribe. Given the following doctor-patient conversation transcript, generate a detailed clinical note.

Transcript:
{transcript}

Return the clinical note in this exact JSON format:
{{
  "chief_complaint": "Brief statement of the patient's main concern or reason for visit.",
  "history_present_illness": "Detailed paragraph covering the patient's description of symptoms (onset, duration, severity, location, aggravating/relieving factors), progression of the condition, and any relevant context.",
  "assessment_plan": "Detailed paragraph covering the doctor's clinical observations, physical examination findings, vital signs if mentioned, clinical impression, primary diagnosis, differential diagnoses considered, prescribed medications with dosages, investigations ordered, specialist referrals, lifestyle modifications, and follow-up instructions.",
  "review_systems": "Brief paragraph covering any systematic review mentioned (cardiovascular, respiratory, gastrointestinal, etc.). Set to null if not discussed.",
  "recommended_labs": [
    {{
      "test_name": "Name of the lab test",
      "reason": "Clinical reasoning for ordering this test based on symptoms/diagnosis"
    }}
  ]
}}

Rules:
- Only include information explicitly mentioned in the transcript
- For recommended_labs, suggest appropriate tests based on the symptoms and diagnosis discussed
- If symptoms suggest specific conditions, recommend relevant diagnostic tests (e.g., HbA1c for diabetes, lipid panel for cardiovascular risk, CBC for infection)
- Do not infer, fabricate, or assume clinical details beyond reasonable clinical judgment
- If a section has no relevant information, set it to null or empty array for labs
- Write each section as a coherent clinical paragraph, not bullet points
- Use proper medical terminology"""


def format_transcript_for_llm(segments: List[Dict]) -> str:
    """Convert transcript segments into readable conversation text"""
    lines = []
    for seg in segments:
        label = seg.get("speaker_label") or seg.get("speaker", "Unknown")
        text = seg.get("text", "").strip()
        if text:
            lines.append(f"{label}: {text}")
    return "\n".join(lines)


def generate_soap_note(segments: List[Dict]) -> Dict:
    """Generate a detailed clinical note from transcript segments using OpenAI"""
    transcript_text = format_transcript_for_llm(segments)

    if not transcript_text:
        return {"error": "Empty transcript, cannot generate clinical note"}

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": SOAP_PROMPT.format(transcript=transcript_text)
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )

    import json
    return json.loads(response.choices[0].message.content)
