import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Download, X, Film } from 'lucide-react';

interface ToastProps {
  message: string;
  downloadUrl: string;
  fileName: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, downloadUrl, fileName, onClose, duration = 7000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-[#0d0d12]/95 border border-emerald-500/20 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-md p-4 overflow-hidden group"
      id="toast-notification"
    >
      {/* Auto-dismiss progress bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-1 bg-emerald-500/60"
      />

      <div className="flex gap-4">
        {/* Success Icon */}
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <Check className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            Export Successful
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {message}
          </p>

          {/* Filename Badge */}
          <div className="mt-2 p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
            <Film className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[10px] font-mono text-slate-300 truncate" title={fileName}>
              {fileName}
            </span>
          </div>

          {/* Download Action Links */}
          <div className="mt-3 flex items-center gap-2">
            <a
              href={downloadUrl}
              download={fileName}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
              id="toast-download-btn"
            >
              <Download className="w-3.5 h-3.5" />
              Download Video
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 shrink-0 h-fit"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
