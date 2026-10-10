export type ToolCategory =
  | 'organize'
  | 'optimize'
  | 'convert-to'
  | 'convert-from'
  | 'edit'
  | 'security'
  | 'intelligence';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  iconName: string;
  isWorking: boolean;
  isPopular?: boolean;
  comingSoonReason?: string;
  badge?: 'Free' | 'Popular' | 'New' | 'Coming Soon';
  acceptedTypes?: string[];
  maxFiles?: number;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl?: string;
  pageCount?: number;
}

export interface ProcessingStatus {
  state: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  message: string;
  progress?: number;
  error?: string;
}

export interface ProcessResult {
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  blob: Blob;
  originalSize?: number;
  compressedSize?: number;
  savingsPercent?: number;
  secondaryDownloads?: { name: string; url: string; blob: Blob }[];
  textContent?: string;
}
