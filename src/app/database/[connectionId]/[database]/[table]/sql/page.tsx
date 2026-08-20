"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { formatCellValue } from "@/lib/utils";
import { Play, AlertTriangle, AlertCircle, Check } from "lucide-react";

export default function SqlPage({ params }: { params: { connectionId: string; database: string; table: string } }) {
  const router = useRouter();
  const [query, setQuery] = useState(`SELECT * FROM \`${params.table}\` LIMIT 50;`);
  const [result, setResult] = useState<{ columns: string[]; rows: Record<string, unknown>[] } | null>(null);
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  }

  async function executeQuery(confirmed = false) {
    setLoading(true);
    setError("");
    setWarning(null);
    setResult(null);
    setCommandResult(null);

    const res = await fetch("/api/database/sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectionId: parseInt(params.connectionId),
        database: params.database,
        query,
        confirmed,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Query failed");
    } else if (data.warning) {
      setWarning(data.message);
    } else if (data.type === "select") {
      setResult({ columns: data.columns, rows: data.rows });
    } else {
      setCommandResult(data.message || `Affected rows: ${data.affectedRows}`);
    }

    setLoading(false);
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
          <button onClick={() => router.push(`/database/${params.connectionId}/${params.database}`)} className="hover:text-primary-600">{params.database}</button>
          <span>/</span>
          <button onClick={() => router.push(`/database/${params.connectionId}/${params.database}/${params.table}`)} className="hover:text-primary-600">{params.table}</button>
          <span>/</span>
          <span className="font-medium text-slate-900">SQL</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">SQL Console</h1>

        <div className="card p-4 mb-4">
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-40 p-3 font-mono text-sm bg-slate-900 text-slate-50 rounded-md focus:outline-none resize-y"
            spellCheck={false}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-500">Use backticks for identifiers. Be careful with destructive queries.</p>
            <button
              onClick={() => executeQuery()}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {loading ? "Executing..." : "Execute"}
            </button>
          </div>
        </div>

        {warning && (
          <div className="card p-4 mb-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium mb-2">{warning}</p>
                <button onClick={() => executeQuery(true)} className="btn-danger text-sm">Confirm & Execute</button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="card p-4 mb-4 bg-red-50 border-red-200 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {commandResult && (
          <div className="card p-4 mb-4 bg-green-50 border-green-200 flex items-center gap-2 text-green-700">
            <Check className="w-5 h-5" />
            {commandResult}
          </div>
        )}

        {result && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {result.columns.map(col => (
                    <th key={col} className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {result.columns!.map(col => (
                      <td key={col} className="px-4 py-2 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                        {row[col] === null ? <span className="text-slate-400 italic">NULL</span> : formatCellValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}