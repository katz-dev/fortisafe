import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import { X } from "lucide-react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "danger" | "info" | "success" | "warning";
  icon?: React.ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "info",
  icon,
}: DialogProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Handle escape key press
  useEffect(() => {
    setIsMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // Don't render on the server
  if (!isMounted) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "bg-red-900/30 text-red-400",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          title: "text-red-400",
        };
      case "warning":
        return {
          icon: "bg-amber-900/30 text-amber-400",
          confirmButton: "bg-amber-600 hover:bg-amber-700 text-white",
          title: "text-amber-400",
        };
      case "success":
        return {
          icon: "bg-green-900/30 text-green-400",
          confirmButton: "bg-green-600 hover:bg-green-700 text-white",
          title: "text-green-400",
        };
      default:
        return {
          icon: "bg-indigo-900/30 text-indigo-400",
          confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white",
          title: "text-indigo-400",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={onClose}
          >
            {/* Dialog */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-[#0a0f1a] border border-slate-800/60 rounded-xl shadow-xl p-6 max-w-md w-full mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  {icon && (
                    <div className={`rounded-full p-2 mr-3 ${styles.icon}`}>
                      {icon}
                    </div>
                  )}
                  <h3 className={`text-xl font-semibold ${styles.title}`}>
                    {title}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-slate-800"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              {description && (
                <div className="mb-6">
                  <p className="text-gray-300">{description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  className="border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-gray-300"
                  onClick={onClose}
                >
                  {cancelText}
                </Button>
                <Button
                  className={styles.confirmButton}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
