"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Download, FileText, CheckCircle2 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("EXECUTIVE_SUMMARY");
  const [format, setFormat] = useState("pdf");

  const handleDownload = () => {
    const url = `${API_BASE_URL}/reports/download?report_type=${reportType}&format=${format}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
            Decision-Support Reports & Exports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Download official operational summaries, route reliability analyses, and data quality exports in CSV or PDF.
          </p>
        </div>
      </div>

      {/* Generator Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-2xl space-y-5">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Generate Operational Report</h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="EXECUTIVE_SUMMARY">Executive Operational Performance Summary</option>
              <option value="ROUTE_PERFORMANCE">Corridor & Route Reliability Analysis</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Export Format</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === "pdf"}
                  onChange={() => setFormat("pdf")}
                  className="text-sky-600 focus:ring-sky-500"
                />
                Official Formatted PDF Document
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                  className="text-sky-600 focus:ring-sky-500"
                />
                Raw Data Table (CSV)
              </label>
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold px-5 py-2.5 rounded-md transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Generate and Download {format.toUpperCase()} Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
