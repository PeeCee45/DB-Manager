"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Database, LogOut, Menu, X, Settings } from "lucide-react";

interface HeaderProps {
  user: { name: string; email: string };
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Database className="w-6 h-6 text-primary-600" />
              <span className="font-bold text-lg text-slate-900">DB Manager</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome, {user.name}</span>
            <Link
              href="/settings"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 px-4 py-3 space-y-3">
          <p className="text-sm text-slate-600">Welcome, {user.name}</p>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 text-sm text-slate-600"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-600"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </header>
  );
}