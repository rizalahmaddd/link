import React from 'react';
import { LogOut } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onOpenGlobalAds: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenGlobalAds,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        
        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-sm tracking-tight">
            L
          </div>
          <span className="font-semibold text-base tracking-tight text-zinc-100">Link</span>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user ? (
            <>
              {/* Global Ads Status Button */}
              <button
                onClick={onOpenGlobalAds}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition-colors"
                title="Pengaturan Iklan Global"
              >
                <span className="hidden sm:inline">Iklan global:</span>
                <span className="sm:hidden text-zinc-400">Iklan</span>
                <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${user.global_ad_enabled ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                <span className="font-medium text-zinc-200">
                  {user.global_ad_enabled ? 'Aktif' : 'Off'}
                </span>
              </button>

              {/* User Email & Logout */}
              <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-zinc-800">
                <span className="text-xs text-zinc-400 hidden md:inline max-w-[160px] truncate" title={user.email}>
                  {user.email}
                </span>
                <button
                  onClick={onLogout}
                  className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
                  title="Keluar"
                  aria-label="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-zinc-400">Pemendek tautan & iklan</div>
          )}
        </div>

      </div>
    </header>
  );
};
