'use client';

import { useState, useCallback, useRef, ChangeEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { UploadResponse } from '@/lib/types';

type UploadState = 'idle' | 'dragging' | 'uploading' | 'error' | 'success';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPE = 'application/pdf';

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validateFile = (file: File): string | null => {
    if (file.type !== ACCEPTED_FILE_TYPE) {
      return 'Please upload a PDF file only.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }
    return null;
  };

  const handleFileSelection = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setState('error');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setState('idle');
  }, []);

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (state !== 'uploading') {
      setState('dragging');
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (state === 'dragging') {
      setState(selectedFile ? 'idle' : 'idle');
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setState('idle');

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleClick = () => {
    if (state !== 'uploading') {
      fileInputRef.current?.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setState('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Upload failed. Please try again.');
      }

      const data: UploadResponse = await response.json();
      setState('success');

      // Redirect to checkout with sessionId
      setTimeout(() => {
        router.push(`/checkout?sessionId=${data.sessionId}`);
      }, 500);
    } catch (error) {
      setState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const getDropZoneClasses = () => {
    const base = 'bg-marty-gray border-2 border-dashed rounded-xl p-12 md:p-16 cursor-pointer transition-all duration-300';
    switch (state) {
      case 'dragging':
        return `${base} border-marty-orange bg-orange-50 scale-[1.01]`;
      case 'error':
        return `${base} border-red-400 bg-red-50`;
      case 'success':
        return `${base} border-green-400 bg-green-50`;
      case 'uploading':
        return `${base} border-gray-300 cursor-not-allowed opacity-75`;
      default:
        return `${base} border-gray-300 hover:border-marty-orange hover:bg-orange-50/50`;
    }
  };

  const getIcon = () => {
    if (state === 'uploading') {
      return (
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 bg-marty-orange rounded-full animate-bounce-loader mb-4" />
          <span className="text-sm font-semibold text-marty-orange uppercase tracking-wide">
            Processing...
          </span>
        </div>
      );
    }

    if (state === 'success') {
      return (
        <svg
          className="w-12 h-12 text-green-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    }

    if (state === 'error') {
      return (
        <svg
          className="w-12 h-12 text-red-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }

    return (
      <svg
        className="w-12 h-12 text-marty-orange"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    );
  };

  const getStatusText = () => {
    switch (state) {
      case 'uploading':
        return '';
      case 'success':
        return 'Success! Redirecting...';
      case 'error':
        return errorMessage;
      case 'dragging':
        return 'Drop your resume here';
      default:
        return selectedFile
          ? selectedFile.name
          : 'Drop your resume here';
    }
  };

  const getSubText = () => {
    if (state === 'idle' && !selectedFile) {
      return 'or click to browse (PDF only)';
    }
    if (selectedFile && state !== 'uploading' && state !== 'success') {
      return `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`;
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={getDropZoneClasses()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={state === 'uploading'}
        />

        <div className="flex flex-col items-center justify-center text-center pointer-events-none">
          {getIcon()}

          {getStatusText() && (
            <p
              className={`mt-4 font-semibold text-base ${
                state === 'error' ? 'text-red-600' : 'text-marty-black'
              }`}
            >
              {getStatusText()}
            </p>
          )}

          {getSubText() && (
            <p className="mt-1 text-sm text-gray-500">
              {getSubText()}
            </p>
          )}
        </div>
      </div>

      {/* Upload Button */}
      {selectedFile && state !== 'uploading' && state !== 'success' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUpload();
          }}
          className="
            mt-6 w-full py-4 px-6
            bg-marty-black hover:bg-marty-orange
            text-white font-semibold rounded-full
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-marty-orange focus:ring-offset-2
          "
        >
          Continue to Payment
        </button>
      )}

      {/* Error State Retry */}
      {state === 'error' && (
        <button
          onClick={() => {
            setState('idle');
            setSelectedFile(null);
            setErrorMessage('');
          }}
          className="
            mt-4 w-full py-3 px-4
            bg-marty-gray hover:bg-gray-200
            text-marty-black font-medium rounded-full
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
          "
        >
          Try Again
        </button>
      )}
    </div>
  );
}
