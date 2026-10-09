from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.gtfs_service import parse_and_import_gtfs_zip
from app.services.ingestion_service import parse_and_preview_csv, import_csv_dataset, get_import_history

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion & Quality Centre"])

@router.post("/gtfs")
async def upload_gtfs(file: UploadFile = File(...), source_name: str = Form("GTFS Zip Import"), db: Session = Depends(get_db)):
    """Uploads and transactionally imports a GTFS Schedule ZIP archive."""
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="File must be a valid .zip GTFS archive")
    contents = await file.read()
    res = parse_and_import_gtfs_zip(db, contents, source_name)
    return res

@router.post("/csv-preview")
async def preview_csv(file: UploadFile = File(...)):
    """Previews top rows and columns of an uploaded CSV file."""
    contents = await file.read()
    return parse_and_preview_csv(contents)

@router.post("/csv-import")
async def import_csv(
    file: UploadFile = File(...), 
    source_name: str = Form("CSV Import"), 
    target_table: str = Form("passenger_counts"), 
    db: Session = Depends(get_db)
):
    """Imports validated CSV rows into analytical tables."""
    contents = await file.read()
    res = import_csv_dataset(db, contents, source_name, target_table)
    return res

@router.get("/history")
def history(db: Session = Depends(get_db)):
    """Returns past ingestion jobs and validation error logs."""
    jobs = get_import_history(db)
    return [
        {
            "id": j.id,
            "source_name": j.source_name,
            "source_type": j.source_type,
            "records_processed": j.records_processed,
            "records_accepted": j.records_accepted,
            "records_rejected": j.records_rejected,
            "validation_errors": j.validation_errors_json,
            "status": j.status,
            "timestamp": j.timestamp
        }
        for j in jobs
    ]
