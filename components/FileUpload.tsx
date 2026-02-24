'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File, type: string) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>('election');
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setUploadMessage(`File selected: ${file.name}`);
      } else {
        setUploadMessage('Please upload a CSV or Excel file');
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setUploadMessage(`File selected: ${file.name}`);
      } else {
        setUploadMessage('Please upload a CSV or Excel file');
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onFileUpload(selectedFile, fileType);
      setUploadMessage('File uploaded successfully!');
      setTimeout(() => {
        setSelectedFile(null);
        setUploadMessage('');
      }, 2000);
    } else {
      setUploadMessage('Please select a file first');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Data Files</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select File Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'election', label: 'Election Data' },
              { value: 'survey', label: 'Survey Data' },
              { value: 'gi', label: 'GI Data' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  fileType === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="fileType"
                  value={option.value}
                  checked={fileType === option.value}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="ml-3 font-medium text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Drag and Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 font-medium mb-2">Drag and drop your file here</p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <label className="inline-block">
            <span className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer font-medium transition-colors">
              Browse Files
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleChange}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-4">CSV or Excel files only</p>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setUploadMessage('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Upload Button */}
        <button
          type="submit"
          disabled={!selectedFile}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
            selectedFile
              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Upload File
        </button>

        {/* Message */}
        {uploadMessage && (
          <div
            className={`p-4 rounded-lg text-sm font-medium ${
              uploadMessage.includes('success')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : uploadMessage.includes('error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {uploadMessage}
          </div>
        )}
      </form>

      {/* Info Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Supported File Formats</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>✓ CSV files (.csv)</li>
          <li>✓ Excel files (.xlsx, .xls)</li>
          <li>✓ Maximum file size: 50 MB</li>
        </ul>
      </div>
    </div>
  );
}
