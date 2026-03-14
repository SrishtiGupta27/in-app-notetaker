from openai import OpenAI
from typing import List, Dict
from app.config import settings

client = OpenAI(api_key=settings.openai_api_key)

SOAP_PROMPT = """You are an experienced medical scribe. Given the following doctor-patient conversation transcript, generate a detailed SOAP note.

Transcript:
{transcript}

Return the SOAP note in this exact JSON format:
{{
  "subjective": "Detailed paragraph covering the patient's chief complaint, description of symptoms (onset, duration, severity, location, aggravating/relieving factors), relevant past medical history, current medications, allergies, and any social or family history mentioned.",
  "objective": "Detailed paragraph covering all clinical observations made by the doctor including vital signs, physical examination findings, and any diagnostic results or test findings discussed.",
  "assessment": "Detailed paragraph covering the doctor's diagnosis or clinical impression, reasoning behind it, any differential diagnoses considered, and the severity or stage of the condition if mentioned.",
  "plan": "Detailed paragraph covering all prescribed medications with dosages, investigations or tests ordered, specialist referrals, lifestyle and dietary advice, patient education provided, and follow-up instructions."
}}

Rules:
- Only include information explicitly mentioned in the transcript
- Do not infer, fabricate, or assume any clinical details
- If a section has no relevant information, set it to null
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
    """Generate a detailed SOAP note from transcript segments using OpenAI"""
    transcript_text = format_transcript_for_llm(segments)

    if not transcript_text:
        return {"error": "Empty transcript, cannot generate SOAP note"}

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
