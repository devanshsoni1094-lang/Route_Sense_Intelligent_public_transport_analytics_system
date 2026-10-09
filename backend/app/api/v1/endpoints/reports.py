from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.report_service import generate_csv_report, generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

@router.get("/download")
def download_report(
    report_type: str = Query("EXECUTIVE_SUMMARY", description="EXECUTIVE_SUMMARY or ROUTE_PERFORMANCE"),
    format: str = Query("pdf", description="pdf or csv"),
    db: Session = Depends(get_db)
):
    """Generates and downloads downloadable CSV or PDF operational reports."""
    if format.lower() == "csv":
        csv_content = generate_csv_report(db, report_type)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=IPTAP_{report_type}.csv"}
        )
    else:
        pdf_bytes = generate_pdf_report(db, report_type)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=IPTAP_{report_type}.pdf"}
        )
