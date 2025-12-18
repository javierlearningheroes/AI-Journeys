import React, { useRef, useState } from 'react';
import { UploadCloud, X, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/pdf', 
      'image/png', 
      'image/jpeg', 
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
    ];
    if (validTypes.includes(file.type)) {
      onFileSelect(file);
    } else {
      alert('Por favor sube un archivo PDF, DOCX (Word) o una imagen (PNG, JPG).');
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.docx"
      />
      
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200
          flex flex-col items-center justify-center text-center min-h-[200px]
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : selectedFile 
              ? 'border-green-500 bg-green-50' 
              : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-white'
          }
        `}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 break-all max-w-full px-4">
              {selectedFile.name}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              onClick={removeFile}
              className="mt-4 text-sm text-red-500 hover:text-red-700 font-medium flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-red-100 hover:border-red-200 transition-colors"
            >
              <X className="w-4 h-4 mr-1" /> Eliminar archivo
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm text-blue-500 rounded-2xl flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Sube tu CV actual
            </h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs">
              Arrastra y suelta tu archivo PDF, Word (DOCX) o imagen aquí, o haz clic para buscar.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-xs text-slate-400 uppercase tracking-wide font-semibold">
              <span className="bg-slate-100 px-2 py-1 rounded">PDF</span>
              <span className="bg-slate-100 px-2 py-1 rounded">DOCX</span>
              <span className="bg-slate-100 px-2 py-1 rounded">IMG</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};