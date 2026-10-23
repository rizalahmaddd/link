import React, { useState, useRef } from 'react';
import { X, Copy, Check, Download, QrCode } from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { ShortLink } from '../types';

interface QRCodeModalProps {
  isOpen: boolean;
  link: ShortLink | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, link, onClose }) => {
  const [fgColor, setFgColor] = useState('#18181b');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !link) return null;

  const fullShortUrl = `${window.location.origin}/${link.slug}`;

  const downloadPNG = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    const linkEl = document.createElement('a');
    linkEl.download = `qr-${link.slug}.png`;
    linkEl.href = canvas.toDataURL('image/png', 1.0);
    linkEl.click();
  };

  const downloadSVG = () => {
    const svgEl = svgRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const linkEl = document.createElement('a');
    linkEl.download = `qr-${link.slug}.svg`;
    linkEl.href = url;
    linkEl.click();
    URL.revokeObjectURL(url);
  };

  const copyShortUrl = () => {
    navigator.clipboard.writeText(fullShortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm sm:max-w-xl md:max-w-2xl shadow-2xl my-auto max-h-[96dvh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800 flex-shrink-0 bg-zinc-900">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-zinc-400" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">Kode QR Tautan</h2>
              <p className="text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-md">/{link.slug} &bull; {link.title || link.target_url}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: 1 col on mobile, 2 cols on sm/md */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-center">
            
            {/* Left: QR Canvas */}
            <div className="flex flex-col items-center justify-center">
              <div
                ref={canvasRef}
                className="p-4 rounded-2xl border border-zinc-800 flex items-center justify-center shadow-lg transition-colors"
                style={{ backgroundColor: bgColor }}
              >
                <QRCodeCanvas
                  value={fullShortUrl}
                  size={200}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="H"
                  marginSize={2}
                />
              </div>

              <div ref={svgRef} className="hidden">
                <QRCodeSVG
                  value={fullShortUrl}
                  size={1024}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="H"
                  marginSize={2}
                />
              </div>

              <span className="text-[11px] text-zinc-500 mt-2 font-mono">Resolusi tinggi (vektor SVG & PNG)</span>
            </div>

            {/* Right: Controls & Actions */}
            <div className="space-y-4">
              
              {/* URL bar */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                  Tautan Singkat
                </label>
                <div className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  <span className="text-zinc-300 truncate mr-2 font-mono">{fullShortUrl}</span>
                  <button
                    onClick={copyShortUrl}
                    className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded transition-colors shrink-0"
                    title="Salin tautan"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Color Palettes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                  Warna Kode QR
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#18181b', name: 'Zinc' },
                    { color: '#0284c7', name: 'Sky' },
                    { color: '#059669', name: 'Emerald' },
                    { color: '#dc2626', name: 'Rose' },
                    { color: '#7c3aed', name: 'Violet' },
                    { color: '#ea580c', name: 'Orange' },
                  ].map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => setFgColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full border-2 ${
                        fgColor === color ? 'border-white scale-110 shadow-sm' : 'border-zinc-800 hover:scale-105'
                      } transition-all`}
                      title={name}
                    />
                  ))}
                </div>
              </div>

              {/* Target info */}
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400">
                <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-0.5">Tujuan:</span>
                <span className="truncate block font-mono text-[11px] text-zinc-300">{link.target_url}</span>
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={downloadPNG}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PNG</span>
                </button>
                <button
                  onClick={downloadSVG}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh SVG</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
