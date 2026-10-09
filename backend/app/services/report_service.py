import io
import csv
from typing import Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from app.services.analytics_service import get_executive_dashboard_kpis, get_all_routes_performance

def generate_csv_report(db: Session, report_type: str) -> str:
    """Generates structured CSV export content."""
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "ROUTE_PERFORMANCE":
        writer.writerow([
            "Route ID", "Route Name", "Origin", "Destination", 
            "Scheduled Trips", "Completed Trips", "OTP (%)", "Mean Delay (min)", "Status"
        ])
        routes = get_all_routes_performance(db)
        for r in routes:
            writer.writerow([
                r["route_id"], r["route_short_name"], r["origin"], r["destination"],
                r["scheduled_trips"], r["completed_trips"], r["otp_pct"], r["mean_delay_min"], r["status_label"]
            ])

    elif report_type == "EXECUTIVE_SUMMARY":
        kpis = get_executive_dashboard_kpis(db)
        writer.writerow(["Metric Name", "Value", "Unit"])
        writer.writerow(["Agency Name", kpis["agency_name"], "Text"])
        writer.writerow(["Operating Mode", kpis["operating_mode"], "Status"])
        writer.writerow(["Scheduled Trips", kpis["scheduled_trips"], "Count"])
        writer.writerow(["Completed Trips", kpis["completed_trips"], "Count"])
        writer.writerow(["Trip Completion Rate", kpis["completion_rate_pct"], "%"])
        writer.writerow(["On-Time Performance (OTP)", kpis["on_time_performance_pct"], "%"])
        writer.writerow(["Mean Delay", kpis["mean_delay_min"], "Minutes"])
        writer.writerow(["Total Passenger Boardings", kpis["passenger_boardings"], "Passengers"])
        writer.writerow(["Fleet Utilization", kpis["fleet_utilization_pct"], "%"])

    return output.getvalue()

def generate_pdf_report(db: Session, report_type: str) -> bytes:
    """Generates professionally formatted PDF operational report using ReportLab."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    kpis = get_executive_dashboard_kpis(db)

    # 1. Header Banner
    p.setFillColor(colors.HexColor("#0F172A"))  # Dark Slate Navy
    p.rect(0, height - 80, width, 80, fill=True, stroke=False)
    
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 18)
    p.drawString(30, height - 40, "INTELLIGENT PUBLIC TRANSPORT ANALYTICS PLATFORM (IPTAP)")
    p.setFont("Helvetica", 11)
    p.drawString(30, height - 60, f"OFFICIAL OPERATIONAL REPORT — {report_type.replace('_', ' ')}")

    # 2. Metadata Box
    p.setFillColor(colors.HexColor("#F8FAFC"))
    p.rect(30, height - 150, width - 60, 55, fill=True, stroke=True)
    p.setFillColor(colors.black)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(40, height - 115, f"Agency: {kpis['agency_name']}")
    p.drawString(40, height - 135, f"Operating Status: {kpis['operating_mode']}")
    p.drawString(320, height - 115, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    p.drawString(320, height - 135, f"Timezone: Asia/Kolkata (IST)")

    # 3. Executive KPI Table
    p.setFont("Helvetica-Bold", 14)
    p.drawString(30, height - 180, "Executive Performance Metrics")
    
    y = height - 210
    metrics_data = [
        ("Scheduled Trips", f"{kpis['scheduled_trips']} trips"),
        ("Completed Trips", f"{kpis['completed_trips']} trips"),
        ("Trip Completion Rate", f"{kpis['completion_rate_pct']}%"),
        ("On-Time Performance (OTP)", f"{kpis['on_time_performance_pct']}%"),
        ("Mean Arrival/Departure Delay", f"{kpis['mean_delay_min']} min"),
        ("Total Passenger Boardings", f"{kpis['passenger_boardings']:,} passengers"),
        ("Fleet Utilization Rate", f"{kpis['fleet_utilization_pct']}%"),
        ("Active Service Disruptions", f"{kpis['active_disruptions_count']} alerts")
    ]

    p.setFont("Helvetica-Bold", 10)
    p.drawString(40, y, "Metric Description")
    p.drawString(320, y, "Observed Measurement")
    p.line(30, y - 5, width - 30, y - 5)
    y -= 20

    p.setFont("Helvetica", 10)
    for label, val in metrics_data:
        p.drawString(40, y, label)
        p.drawString(320, y, val)
        y -= 18

    # 4. Operational Insights
    y -= 15
    p.setFont("Helvetica-Bold", 14)
    p.drawString(30, y, "Key Evidence-Backed Operational Insights")
    y -= 25

    p.setFont("Helvetica", 9)
    for ins in kpis["insights"]:
        p.setFont("Helvetica-Bold", 10)
        p.drawString(40, y, f"• {ins['title']}")
        y -= 14
        p.setFont("Helvetica", 9)
        p.drawString(50, y, f"Corridor/Stop: {ins['stop_name']} | Window: {ins['time_window']}")
        y -= 14
        p.drawString(50, y, f"Suspected Cause: {ins['suspected_cause']}")
        y -= 14
        p.drawString(50, y, f"Evidence: {ins['evidence_summary']}")
        y -= 22

    # Footer
    p.setFont("Helvetica-Oblique", 8)
    p.setFillColor(colors.gray)
    p.drawString(30, 30, "Confidential — Decision Support Report for Transport Department & Municipal Corporation")
    p.drawString(width - 150, 30, "Page 1 of 1")

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue()
