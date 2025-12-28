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

  const getBorderColor = () => {
    switch (state) {
      case 'dragging':
        return 'border-blue-400 bg-blue-50';
      case 'error':
        return 'border-red-400 bg-red-50';
      case 'success':
        return 'border-green-400 bg-green-50';
      default:
        return 'border-gray-300 hover:border-gray-400';
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'uploading':
        return (
          <svg
            className="w-12 h-12 text-blue-500 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'success':
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
      case 'error':
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
      default:
        return (
          <svg
            className="w-12 h-12 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'uploading':
        return 'Uploading your resume...';
      case 'success':
        return 'Success! Redirecting to checkout...';
      case 'error':
        return errorMessage;
      case 'dragging':
        return 'Drop your resume here';
      default:
        return selectedFile
          ? selectedFile.name
          : 'Drag and drop your resume, or click to browse';
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 md:p-12
          transition-all duration-200 ease-in-out cursor-pointer
          ${getBorderColor()}
          ${state === 'uploading' ? 'cursor-not-allowed opacity-75' : ''}
        `}
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

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {getIcon()}

          <div className="space-y-2">
            <p
              className={`text-sm md:text-base font-medium ${
                state === 'error' ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              {getStatusText()}
            </p>

            {state === 'idle' && !selectedFile && (
              <p className="text-xs md:text-sm text-gray-500">
                PDF only, maximum 5MB
              </p>
            )}

            {selectedFile && state !== 'uploading' && state !== 'success' && (
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upload Button */}
      {selectedFile && state !== 'uploading' && state !== 'success' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUpload();
          }}
          disabled={false}
          className="
            mt-6 w-full py-3 px-6
            bg-blue-600 hover:bg-blue-700
            text-white font-medium rounded-lg
            transition-colors duration-200
            disabled:bg-gray-400 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
        >
          Continue to Payment
        </button>
      )}

      {/* Help Text */}
      {state === 'idle' && !selectedFile && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
            Upload your resume to get started. We'll analyze your experience and find 25 job
            opportunities matched to your skills. 5 jobs delivered instantly, 20 more sent to your
            email.
          </p>
        </div>
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
            mt-4 w-full py-2 px-4
            bg-gray-100 hover:bg-gray-200
            text-gray-700 font-medium rounded-lg
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
