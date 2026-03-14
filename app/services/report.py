from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader
from datetime import datetime
from typing import Dict, List
import os

# Load templates from app/templates/
template_env = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "../templates"))
)


def generate_pdf_report(
    session_id: str,
    filename: str,
    status: str,
    transcript: List[Dict],
    soap: Dict = None,
) -> bytes:
    """Render the HTML template and convert to PDF bytes"""

    template = template_env.get_template("report.html")

    html_str = template.render(
        session_id=session_id,
        filename=filename or "N/A",
        status=status,
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        transcript=transcript,
        soap=soap,
    )

    return HTML(string=html_str).write_pdf()
