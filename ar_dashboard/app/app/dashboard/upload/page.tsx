
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface UploadStatus {
  uploading: boolean;
  progress: number;
  success: boolean | null;
  message: string;
  details: any;
  errors: string[];
  warnings: string[];
}

interface DataStatus {
  lastUpload: string | null;
  latestDataWeek: string | null;
  totalRecords: number;
  status: string;
}

export default function UploadPage() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    uploading: false,
    progress: 0,
    success: null,
    message: '',
    details: null,
    errors: [],
    warnings: []
  });

  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);

  // Fetch current data status
  const fetchDataStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/upload-csv');
      if (response.ok) {
        const status = await response.json();
        setDataStatus(status);
      }
    } catch (error) {
      console.error('Failed to fetch data status:', error);
    }
  }, []);

  useEffect(() => {
    fetchDataStatus();
  }, [fetchDataStatus]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    // Reset status
    setUploadStatus({
      uploading: true,
      progress: 0,
      success: null,
      message: 'Uploading file...',
      details: null,
      errors: [],
      warnings: []
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress (since we can't track real upload progress easily)
      setUploadStatus(prev => ({ ...prev, progress: 25, message: 'Validating file format...' }));

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      setUploadStatus(prev => ({ ...prev, progress: 50, message: 'Processing data...' }));

      const result = await response.json();

      setUploadStatus(prev => ({ ...prev, progress: 75, message: 'Updating database...' }));

      // Final status
      setUploadStatus({
        uploading: false,
        progress: 100,
        success: response.ok,
        message: result.message || (response.ok ? 'Upload successful' : 'Upload failed'),
        details: result.details || null,
        errors: result.errors || [],
        warnings: result.warnings || []
      });

      if (response.ok) {
        toast.success('CSV file uploaded successfully!');
        fetchDataStatus(); // Refresh data status
      } else {
        toast.error('Upload failed. Please check the errors below.');
      }

    } catch (error) {
      setUploadStatus({
        uploading: false,
        progress: 0,
        success: false,
        message: 'Upload failed due to network error',
        details: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      });
      toast.error('Upload failed due to network error');
    }
  }, [fetchDataStatus]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const resetUpload = () => {
    setUploadStatus({
      uploading: false,
      progress: 0,
      success: null,
      message: '',
      details: null,
      errors: [],
      warnings: []
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Data Upload</h1>
        <p className="text-slate-400">Upload CSV files to update AR metrics data</p>
      </div>

      {/* Current Data Status */}
      {dataStatus && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Data Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-400">Total Records</p>
                <p className="text-lg font-semibold text-white">{dataStatus.totalRecords}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Latest Data Week</p>
                <p className="text-lg font-semibold text-white">
                  {dataStatus.latestDataWeek 
                    ? new Date(dataStatus.latestDataWeek).toLocaleDateString()
                    : 'No data'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Last Upload</p>
                <p className="text-lg font-semibold text-white">
                  {dataStatus.lastUpload 
                    ? new Date(dataStatus.lastUpload).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
            <Badge 
              variant={dataStatus.status === 'ready' ? 'default' : 'destructive'}
              className="w-fit"
            >
              {dataStatus.status === 'ready' ? 'Data Available' : 'No Data'}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Upload CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file containing AR metrics data. File must be under 5MB and contain the required columns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!uploadStatus.uploading && uploadStatus.success === null ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-500/10'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-blue-400 text-lg">Drop the CSV file here...</p>
              ) : (
                <div>
                  <p className="text-white text-lg mb-2">Drag & drop a CSV file here</p>
                  <p className="text-slate-400 mb-4">or click to select a file</p>
                  <Button variant="outline" className="border-slate-600">
                    Select File
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-4">
                Supported format: CSV (max 5MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress */}
              {uploadStatus.uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{uploadStatus.message}</span>
                    <span className="text-slate-400">{uploadStatus.progress}%</span>
                  </div>
                  <Progress value={uploadStatus.progress} className="h-2" />
                </div>
              )}

              {/* Success/Error Status */}
              {uploadStatus.success !== null && (
                <Alert className={uploadStatus.success ? 'border-green-500' : 'border-red-500'}>
                  <div className="flex items-center gap-2">
                    {uploadStatus.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertDescription className="text-white">
                      {uploadStatus.message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Upload Details */}
              {uploadStatus.details && (
                <Card className="bg-slate-900/50 border-slate-600">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Filename</p>
                        <p className="text-white font-medium">{uploadStatus.details.filename}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Total Records</p>
                        <p className="text-white font-medium">{uploadStatus.details.totalRecords}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Processed</p>
                        <p className="text-green-400 font-medium">{uploadStatus.details.successCount}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Skipped</p>
                        <p className="text-yellow-400 font-medium">{uploadStatus.details.skipCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {uploadStatus.warnings.length > 0 && (
                <Alert className="border-yellow-500">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription>
                    <div className="text-white mb-2">Warnings:</div>
                    <ul className="text-sm text-slate-300 space-y-1">
                      {uploadStatus.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Errors */}
              {uploadStatus.errors.length > 0 && (
                <Alert className="border-red-500">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription>
                    <div className="text-white mb-2">Errors:</div>
                    <ul className="text-sm text-slate-300 space-y-1">
                      {uploadStatus.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={resetUpload} variant="outline" className="border-slate-600">
                  Upload Another File
                </Button>
                {uploadStatus.success && (
                  <Button onClick={fetchDataStatus} className="bg-blue-600 hover:bg-blue-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data Status
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expected Format Information */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Expected CSV Format
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-slate-300">
              Your CSV file must contain the following columns in order:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              {[
                'Week', 'Overdue GMV', 'Collected GMV', 'Collected Invoices', 'DSO',
                'Weighted Avg Days Overdue', 'Weighted Avg Days Late', 'Due: 0-10 Days',
                'Due: 11-30 Days', 'Due: 31-60 Days', 'Due: 61-90 Days', 'Due: 90+ Days',
                '% Credit Sales', 'CEI', 'AR Turnover Ratio'
              ].map((column) => (
                <Badge key={column} variant="outline" className="border-slate-600 text-slate-300">
                  {column}
                </Badge>
              ))}
            </div>
            <div className="text-sm text-slate-400 space-y-1">
              <p>• Week column should be in M/D/YYYY format (e.g., 5/15/2023)</p>
              <p>• Currency values can include $ symbols and commas</p>
              <p>• Percentage values can include % symbols</p>
              <p>• Empty cells, #N/A, and #VALUE! are handled automatically</p>
            </div>
            <Button variant="outline" className="border-slate-600">
              <Download className="h-4 w-4 mr-2" />
              Download Sample Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
