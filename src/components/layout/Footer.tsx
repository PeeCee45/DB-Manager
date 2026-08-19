"use client";

import { Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-slate-500">
          <span>Created & Developed by Promise Ibeh</span>
          <a
            href="https://github.com/PeeCee45"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-primary-600 transition-colors"
          >
            <Github className="w-4 h-4" />
            github.com/PeeCee45
          </a>
        </div>
      </div>
    </footer>
  );
}
