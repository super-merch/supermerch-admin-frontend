import React from 'react';
import { X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger" // danger, success, primary
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700",
    success: "bg-teal-600 hover:bg-teal-700",
    primary: "bg-blue-600 hover:bg-blue-700"
  };

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm w-full h-full flex justify-center items-center z-50'>
      <div className='bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 animate-fadeIn'>
        <div className='flex justify-between items-start mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>{message}</h2>
          <button 
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>
        
        <div className='flex justify-end gap-3 mt-6'>
          <button 
            onClick={onClose}
            className='px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium'
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-md text-white transition-colors font-medium ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}