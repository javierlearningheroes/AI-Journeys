
import React, { useState } from 'react';
import { Upload, X, FileText, Link as LinkIcon, File, Image as ImageIcon } from 'lucide-react';
import { UploadedFile } from '../types';

interface BusinessFileUploadProps {
  files: UploadedFile[];
  setFiles: (files: UploadedFile[]) => void;
  urls: string[];
  setUrls: (urls: string[]) => void;
}

export const BusinessFileUpload: React.FC<BusinessFileUploadProps> = ({ files, setFiles, urls, setUrls }) => {
  const [urlInput, setUrlInput] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: UploadedFile[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        // Simple base64 reader
        const reader = new FileReader();
        
        const contentPromise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
             const result = reader.result as string;
             // Remove data URL prefix for API usage if it's binary
             const base64Content = result.split(',')[1];
             
             // For .txt, .md, .csv, read as text.
             if (file.type === "text/plain" || file.type === "text/csv" || file.type === "text/markdown" || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                const textReader = new FileReader();
                textReader.onload = () => resolve(textReader.result as string);
                textReader.readAsText(file);
             } else {
                resolve(base64Content);
             }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        try {
          const content = await contentPromise;
          newFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            content: content
          });
        } catch (err) {
          console.error("Error reading file", err);
        }
      }

      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    if (urlInput.trim()) {
      setUrls([...urls, urlInput.trim()]);
      setUrlInput('');
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const getIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative bg-white">
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className="p-3 bg-blue-50 rounded-full">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Haz clic o arrastra documentos aquí</p>
            <p className="text-xs text-slate-500 mt-1">Soporta PDF, TXT, CSV, Imágenes (Máx 10MB)</p>
          </div>
        </div>
      </div>

      {/* URL Input Area */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <LinkIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addUrl()}
            placeholder="Añadir URL de la empresa (web, linkedin...)"
            className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-sm"
          />
        </div>
        <button
          onClick={addUrl}
          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95"
        >
          Añadir
        </button>
      </div>

      {/* File & URL List */}
      {(files.length > 0 || urls.length > 0) && (
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Elementos Cargados</h3>
            
            {files.map((file, idx) => (
              <div key={`file-${idx}`} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 overflow-hidden">
                  {getIcon(file.type)}
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</span>
                  <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button onClick={() => removeFile(idx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {urls.map((url, idx) => (
              <div key={`url-${idx}`} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 overflow-hidden">
                  <LinkIcon className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[300px]">{url}</span>
                </div>
                <button onClick={() => removeUrl(idx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
