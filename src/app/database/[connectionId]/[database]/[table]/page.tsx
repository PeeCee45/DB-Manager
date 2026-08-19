"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Plus, X, Check, AlertCircle } from "lucide-react";

interface Column {
  name: string;
  type: string;
  nullable: string;
  key: string;
  default: string | null;
  extra: string;
}

export default function TablePage({ params }: { params: { connectionId: string; database: string; table: string } }) {
  const router = useRouter();
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [primaryKey, setPrimaryKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showInsert, setShowInsert] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [insertData, setInsertData] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, perPage, sortColumn, sortDirection]);

  async function fetchUser() {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  }

  async function loadData() {
    setLoading(true);
    setError("");
    const url = new URL(`/api/database/rows`, window.location.origin);
    url.searchParams.set("connectionId", params.connectionId);
    url.searchParams.set("database", params.database);
    url.searchParams.set("table", params.table);
    url.searchParams.set("page", page.toString());
    url.searchParams.set("perPage", perPage.toString());
    if (search) url.searchParams.set("search", search);
    if (sortColumn) {
      url.searchParams.set("sortColumn", sortColumn);
      url.searchParams.set("sortDirection", sortDirection);
    }

    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      setColumns(data.columns);
      setRows(data.rows);
      setPrimaryKey(data.primaryKey);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } else {
      const err = await res.json();
      setError(err.error || "Failed to load data");
    }
    setLoading(false);
  }

  function handleSort(col: string) {
    if (sortColumn === col) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!primaryKey) {
      alert("No primary key found. Cannot delete row safely.");
      return;
    }
    if (!confirm("Delete this record?")) return;

    const url = new URL(`/api/database/rows`, window.location.origin);
    url.searchParams.set("connectionId", params.connectionId);
    url.searchParams.set("database", params.database);
    url.searchParams.set("table", params.table);
    url.searchParams.set("primaryKey", primaryKey);
    url.searchParams.set("primaryKeyValue", String(row[primaryKey]));

    const res = await fetch(url.toString(), { method: "DELETE" });
    if (res.ok) {
      loadData();
    }
  }

  async function handleInsert() {
    const res = await fetch("/api/database/rows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectionId: parseInt(params.connectionId),
        database: params.database,
        table: params.table,
        data: insertData,
      }),
    });

    if (res.ok) {
      setShowInsert(false);
      setInsertData({});
      loadData();
    } else {
      const err = await res.json();
      setError(err.error || "Insert failed");
    }
  }

  async function handleUpdate() {
    if (!editingRow || !primaryKey) return;

    const res = await fetch("/api/database/rows", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectionId: parseInt(params.connectionId),
        database: params.database,
        table: params.table,
        data: editingRow,
        primaryKey,
        primaryKeyValue: editingRow[primaryKey],
      }),
    });

    if (res.ok) {
      setEditingRow(null);
      loadData();
    } else {
      const err = await res.json();
      setError(err.error || "Update failed");
    }
  }

  function startEdit(row: Record<string, unknown>) {
    setEditingRow({ ...row });
  }

  if (!user) return null;

  const visibleColumns = columns.slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
          <button onClick={() => router.push(`/database/${params.connectionId}`)} className="hover:text-primary-600">Databases</button>
          <span>/</span>
          <button onClick={() => router.push(`/database/${params.connectionId}/${params.database}`)} className="hover:text-primary-600">{params.database}</button>
          <span>/</span>
          <span className="font-medium text-slate-900">{params.table}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{params.table}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/database/${params.connectionId}/${params.database}/${params.table}/structure`)} className="btn-secondary text-sm">Structure</button>
            <button onClick={() => router.push(`/database/${params.connectionId}/${params.database}/${params.table}/sql`)} className="btn-secondary text-sm">SQL</button>
            <button onClick={() => setShowInsert(true)} className="btn-primary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Insert</button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search across all columns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loadData()}
              className="input-field pl-9"
            />
          </div>
          <button onClick={loadData} className="btn-secondary text-sm">Search</button>
          <select value={perPage} onChange={e => { setPerPage(parseInt(e.target.value)); setPage(1); }} className="input-field w-auto py-1.5">
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 w-10"></th>
                    {visibleColumns.map(col => (
                      <th
                        key={col.name}
                        onClick={() => handleSort(col.name)}
                        className="px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1">
                          {col.name}
                          {sortColumn === col.name && (sortDirection === "asc" ? " ↑" : " ↓")}
                        </div>
                      </th>
                    ))}
                    {columns.length > 8 && <th className="px-3 py-2 text-slate-400">...</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(row)} className="p-1 text-slate-400 hover:text-primary-600"><Pencil className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(row)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </td>
                      {visibleColumns.map(col => (
                        <td key={col.name} className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                          {row[col.name] === null ? <span className="text-slate-400 italic">NULL</span> : String(row[col.name])}
                        </td>
                      ))}
                      {columns.length > 8 && <td className="px-3 py-2 text-slate-400">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-slate-600">Page {page} of {totalPages} • {total.toLocaleString()} total rows</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 border rounded-md disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 border rounded-md disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}

        {showInsert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Insert Row</h2>
                <button onClick={() => setShowInsert(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                {columns.map(col => (
                  <div key={col.name}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {col.name} <span className="text-slate-400 font-normal">{col.type}{col.nullable === "NO" && !col.default && !col.extra.includes("auto_increment") ? " *" : ""}</span>
                    </label>
                    <input
                      className="input-field"
                      placeholder={col.extra.includes("auto_increment") ? "Auto increment" : col.default || ""}
                      disabled={col.extra.includes("auto_increment")}
                      value={insertData[col.name] || ""}
                      onChange={e => setInsertData({ ...insertData, [col.name]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowInsert(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleInsert} className="btn-primary flex items-center gap-2"><Check className="w-4 h-4" /> Insert</button>
              </div>
            </div>
          </div>
        )}

        {editingRow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Edit Row</h2>
                <button onClick={() => setEditingRow(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                {columns.map(col => (
                  <div key={col.name}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {col.name} <span className="text-slate-400 font-normal">{col.type}</span>
                    </label>
                    <input
                      className="input-field"
                      value={editingRow[col.name] === null ? "" : String(editingRow[col.name] || "")}
                      onChange={e => setEditingRow({ ...editingRow, [col.name]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditingRow(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleUpdate} className="btn-primary flex items-center gap-2"><Check className="w-4 h-4" /> Update</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}