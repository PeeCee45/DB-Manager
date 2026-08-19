
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Table, ArrowRight, ArrowLeft, Rows3 } from "lucide-react";

interface TableInfo {
  name: string;
  engine: string | null;
  rows: number | null;
  size: number | null;
}

export default function DatabasePage({ params }: { params: { connectionId: string; database: string } }) {
  const router = useRouter();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetchUser();
    loadTables();
  }, []);

  async function fetchUser() {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  }

  async function loadTables() {
    const res = await fetch(`/api/database/tables?connectionId=${params.connectionId}&database=${params.database}`);
    if (res.ok) {
      const data = await res.json();
      setTables(data.tables);
    }
    setLoading(false);
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
          <button onClick={() => router.push(`/database/${params.connectionId}`)} className="hover:text-primary-600">
            Databases
          </button>
          <ArrowLeft className="w-3 h-3 rotate-180" />
          <span className="font-medium text-slate-900">{params.database}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Tables</h1>

        {loading ? (
          <div className="text-center py-12">Loading tables...</div>
        ) : tables.length === 0 ? (
          <div className="card p-12 text-center">
            <Table className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No tables found in this database.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700">Table Name</th>
                  <th className="px-4 py-3 font-medium text-slate-700 hidden md:table-cell">Engine</th>
                  <th className="px-4 py-3 font-medium text-slate-700 hidden lg:table-cell">Rows (approx)</th>
                  <th className="px-4 py-3 font-medium text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tables.map(table => (
                  <tr key={table.name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                      <Table className="w-4 h-4 text-slate-400" />
                      {table.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{table.engine || "-"}</td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                      {table.rows !== null ? table.rows.toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => router.push(`/database/${params.connectionId}/${params.database}/${table.name}`)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-md inline-flex items-center gap-1 text-sm font-medium"
                      >
                        <Rows3 className="w-4 h-4" /> Browse
                      </button>
                    </td>
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