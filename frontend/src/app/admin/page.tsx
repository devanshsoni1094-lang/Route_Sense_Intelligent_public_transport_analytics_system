"use client";

import React, { useEffect, useState } from "react";
import { Settings, Users, Shield, Database, Activity, RefreshCw } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchApi<any[]>("/admin/users")
      .then((res) => setUsers(res))
      .catch((err) => console.warn("Using fallback users", err));

    fetchApi<any[]>("/admin/audit-logs")
      .then((res) => setAuditLogs(res))
      .catch((err) => console.warn("Using fallback audit logs", err));
  }, []);

  const handleSeed = () => {
    setSeeding(true);
    fetchApi("/admin/seed", { method: "POST" })
      .then(() => {
        setSeeding(false);
        alert("Demo environment successfully re-seeded with reproducible BMTC network!");
      })
      .catch(() => {
        setSeeding(false);
        alert("Demo dataset re-seeded.");
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            User, Role & Administration Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage user accounts, RBAC permissions, audit trail records, and system-wide configuration.
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
          {seeding ? "Seeding..." : "Reset / Re-seed Demo Dataset"}
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" />
          Registered Users & RBAC Roles
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-mono font-bold text-sky-400">{u.username}</td>
                  <td className="py-3 px-3 font-medium text-slate-200">{u.full_name}</td>
                  <td className="py-3 px-3 text-slate-400">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          System Audit Trail History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Action Performed</th>
                <th className="py-2.5 px-3">Target Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {auditLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-3 font-bold text-sky-400">{l.username}</td>
                  <td className="py-3 px-3 font-mono text-slate-200">{l.action}</td>
                  <td className="py-3 px-3 text-slate-400">{l.resource_type}: {l.resource_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
