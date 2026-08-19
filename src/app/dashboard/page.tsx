import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAppDb } from "@/lib/db/app";
import { RowDataPacket } from "mysql2/promise";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Plus, Database, Clock, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await getAppDb();
  
  const [connections] = await db.execute<RowDataPacket[]>(
    `SELECT id, name, host, database_name, last_used_at 
     FROM connections WHERE user_id = ? ORDER BY last_used_at DESC LIMIT 5`,
    [user.id]
  );

  const [countResult] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM connections WHERE user_id = ?`,
    [user.id]
  );
  const connectionCount = countResult[0].count;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name}</h1>
          <p className="text-slate-600 mt-1">Manage your database connections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">Connections</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{connectionCount}</p>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">Recent Activity</h3>
            </div>
            <p className="text-sm text-slate-600">
              {connections.length > 0 ? "Active recently" : "No recent activity"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">My Connections</h2>
          <Link href="/dashboard/connections" className="btn-secondary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Connection
          </Link>
        </div>

        {connections.length === 0 ? (
          <div className="card p-12 text-center">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No connections yet</h3>
            <p className="text-slate-600 mb-4">Add your first database connection to get started.</p>
            <Link href="/dashboard/connections" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Connection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((conn: RowDataPacket) => (
              <div key={conn.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{conn.name}</h3>
                    <p className="text-sm text-slate-500">{conn.host}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                </div>
                <p className="text-sm text-slate-600 mb-1">Database: {conn.database_name}</p>
                <p className="text-xs text-slate-400 mb-4">
                  Last used: {formatDate(conn.last_used_at)}
                </p>
                <Link
                  href={`/database/${conn.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  Open Database <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}