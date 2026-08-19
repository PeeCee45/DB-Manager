"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Database, ArrowRight, Server } from "lucide-react";

interface DatabaseInfo {
  name: string;
  isSystem: boolean;
}

export default function ConnectionPage({ params }: { params: { connectionId: string } }) {
  const router = useRouter();
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetchUser();
    loadDatabases();
  }, []);

  async function fetchUser() {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  }

  async function loadDatabases() {
    const res = await fetch(`/api/database/databases?connectionId=${params.connectionId}`);
    if (res.ok) {
      const data = await res.json();
      setDatabases(data.databases);
    }
    setLoading(false);
  }

  if (!user) return null;

  const userDbs = databases.filter(d => !d.isSystem);
  const systemDbs = databases.filter(d => d.isSystem);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Select Database</h1>
            <p className="text-sm text-slate-600 flex items-center gap-1">
              <Server className="w-3 h-3" /> Connection #{params.connectionId}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading databases...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userDbs.map(db => (
              <button
                key={db.name}
                onClick={() => router.push(`/database/${params.connectionId}/${db.name}`)}
                className="card p-5 text-left hover:shadow-md transition-shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-slate-900">{db.name}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
            
            {systemDbs.map(db => (
              <button
                key={db.name}
                onClick={() => router.push(`/database/${params.connectionId}/${db.name}`)}
                className="card p-5 text-left hover:shadow-md transition-shadow flex items-center justify-between opacity-70"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-600">{db.name}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}