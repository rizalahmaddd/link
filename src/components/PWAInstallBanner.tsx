import React, { useState } from 'react';
import { Download, X } from 'lucide-react';

interface PWAInstallBannerProps {
  onInstall: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onInstall }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 text-zinc-300 text-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>Pasang Link di perangkat untuk akses lebih cepat.</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onInstall}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
            aria-label="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
