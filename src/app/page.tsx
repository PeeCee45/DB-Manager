import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-primary-600 rounded-xl mx-auto mb-6 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5l-2.879 2.879M12 12L9.121 9.121m0 5.758L12 12m0 0h.001" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">DB Manager</h1>
        <p className="text-slate-600 mb-8">
          A modern, secure web-based MySQL and MariaDB management tool.
        </p>
        <div className="space-x-4">
          <Link href="/login" className="btn-primary inline-block">Sign In</Link>
          <Link href="/register" className="btn-secondary inline-block">Create Account</Link>
        </div>
      </div>
    </div>
  );
}