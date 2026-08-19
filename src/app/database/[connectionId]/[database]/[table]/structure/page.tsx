"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Key, Hash } from "lucide-react";

interface Column {
  name: string;
  type: string;
  nullable: string;
  key: string;
  default: string | null;
  extra: string;
}

interface Index {
  name: string;
  column: string;
  unique: boolean;
  type: string;
}

export default function StructurePage({ params }: { params: { connectionId: string; database: string; table: string } }) {
  const router = useRouter();
  const [columns, setColumns] = useState<Column[]>([]);
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetchUser();
    loadStructure();
  }, []);

  async function fetchUser() {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  }

  async function loadStructure() {
    const res = await fetch(`/api/database/structure?connectionId=${params.connectionId}&database=${params.database}&table=${params.table}`);
    if (res.ok) {
      const data = await res.json();
      setColumns(data.columns);
      setIndexes(data.indexes);
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
          <span className="font-medium text-slate-900">Structure</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Table Structure</h1>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900">Columns</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-700">Column</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Type</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Nullable</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Key</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Default</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Extra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {columns.map(col => (
                      <tr key={col.name} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                          {col.key === "PRI" && <Key className="w-3 h-3 text-amber-500" />}
                          {col.key === "UNI" && <Hash className="w-3 h-3 text-blue-500" />}
                          {col.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{col.type}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${col.nullable === "NO" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                            {col.nullable}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{col.key || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{col.default === null ? <span className="italic text-slate-400">NULL</span> : col.default}</td>
                        <td className="px-4 py-3 text-slate-600">{col.extra || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900">Indexes</h2>
              </div>
              {indexes.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No indexes defined</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Column</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Type</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Unique</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {indexes.map((idx, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{idx.name}</td>
                        <td className="px-4 py-3 text-slate-600">{idx.column}</td>
                        <td className="px-4 py-3 text-slate-600">{idx.type}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${idx.unique ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                            {idx.unique ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

