import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden"
        >
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full shrink-0 ${
              variant === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400' :
              variant === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400' :
              'bg-teal-100 text-teal-600 dark:bg-teal-950/80 dark:text-teal-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            {description}
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition ${
                variant === 'danger' 
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800' 
                  : variant === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                  : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
