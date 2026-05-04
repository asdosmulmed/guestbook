import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export default function Toast({ message, show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down">
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl px-6 py-4 flex items-center gap-3">
        <CheckCircle className="text-blue-600" size={24} />
        <p className="text-lg font-bold text-slate-900">{message}</p>
      </div>
    </div>
  );
}
