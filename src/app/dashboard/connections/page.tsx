
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Plus, Pencil, Trash2, TestTube, Database, ArrowRight, X, Check, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Connection {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  database_name: string;
  last_used_at: string | null;
}

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: "3306",
    username: "",
    password: "",
    database_name: "",
  });

  useEffect(() => {
    fetchUser();
    loadConnections();
  }, []);

  async function fetchUser() {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    } else {
      router.push("/login");
    }
  }

  async function loadConnections() {
    const res = await fetch("/api/connections");
    if (res.ok) {
      const data = await res.json();
      setConnections(data.connections);
    }
    setLoading(false);
  }

  async function handleTest() {
    setTestResult(null);
    const res = await fetch("/api/connections/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    setTestResult(data);
  }

  async function handleSave() {
    const url = "/api/connections";
    const method = editingId ? "PUT" : "POST";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, id: editingId, port: parseInt(formData.port) }),
    });

    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadConnections();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this connection?")) return;
    await fetch(`/api/connections?id=${id}`, { method: "DELETE" });
    loadConnections();
  }

  function startEdit(conn: Connection) {
    setEditingId(conn.id);
    setFormData({
      name: conn.name,
      host: conn.host,
      port: conn.port.toString(),
      username: conn.username,
      password: "",
      database_name: conn.database_name,
    });
    setShowForm(true);
    setTestResult(null);
  }

  function resetForm() {
    setFormData({ name: "", host: "", port: "3306", username: "", password: "", database_name: "" });
    setTestResult(null);
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Connections</h1>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Connection
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Connection" : "New Connection"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Project A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hostname</label>
                <input className="input-field" value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} placeholder="db.example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                <input className="input-field" value={formData.port} onChange={e => setFormData({...formData, port: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Database</label>
                <input className="input-field" value={formData.database_name} onChange={e => setFormData({...formData, database_name: e.target.value})} placeholder="mydb" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input className="input-field" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password {editingId && "(leave blank to keep current)"}</label>
                <input type="password" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>

            {testResult && (
              <div className={`mb-4 p-3 rounded-md text-sm flex items-center gap-2 ${testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {testResult.message}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleTest} className="btn-secondary flex items-center gap-2">
                <TestTube className="w-4 h-4" /> Test Connection
              </button>
              <button onClick={handleSave} className="btn-primary">Save Connection</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : connections.length === 0 ? (
          <div className="card p-12 text-center">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No connections saved yet.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-700 hidden md:table-cell">Host</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Database</th>
                  <th className="px-4 py-3 font-medium text-slate-700 hidden lg:table-cell">Last Used</th>
                  <th className="px-4 py-3 font-medium text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {connections.map(conn => (
                  <tr key={conn.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{conn.name}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{conn.host}:{conn.port}</td>
                    <td className="px-4 py-3 text-slate-600">{conn.database_name}</td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatDate(conn.last_used_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => router.push(`/database/${conn.id}`)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-md">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => startEdit(conn)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(conn.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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