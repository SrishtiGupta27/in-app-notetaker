import re
from typing import Dict, List

class PrivacyService:
    """Placeholder PII scrubbing logic for privacy-first approach"""
    
    @staticmethod
    def scrub_pii(text: str) -> str:
        """Basic PII scrubbing - replace with more sophisticated logic in production"""
        # Phone numbers
        text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)
        
        # Email addresses
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
        
        # SSN patterns
        text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN]', text)
        
        return text
    
    @staticmethod
    def scrub_transcript(transcript: List[Dict]) -> List[Dict]:
        """Scrub PII from transcript segments"""
        scrubbed = []
        for segment in transcript:
            scrubbed_segment = segment.copy()
            if 'text' in scrubbed_segment:
                scrubbed_segment['text'] = PrivacyService.scrub_pii(scrubbed_segment['text'])
            scrubbed.append(scrubbed_segment)
        return scrubbed
