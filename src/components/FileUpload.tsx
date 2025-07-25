import { useState, useRef } from 'react';
import { Upload, Plus, X, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { FilePreview } from './FilePreview';
import { CodeDisplay } from './CodeDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUploadComplete?: (code: string) => void;
}

export const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [burnAfterDownload, setBurnAfterDownload] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCode, setUploadCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { toast } = useToast();

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const code = generateCode();
      const progressPerFile = 100 / files.length;
      let currentProgress = 0;

      // Upload each file to Supabase Storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${code}/${Date.now()}_${file.name}`;
        const storagePath = `${code}/${file.name}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // Insert file metadata into database
        const { error: dbError } = await supabase
          .from('files')
          .insert({
            filename: code,
            original_filename: file.name,
            storage_path: storagePath,
            file_size: file.size,
            mime_type: file.type,
            burn_after_download: burnAfterDownload,
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
          });

        if (dbError) {
          throw dbError;
        }

        // Update progress
        currentProgress += progressPerFile;
        setUploadProgress(Math.min(currentProgress, 100));
      }

      setUploadCode(code);
      onUploadComplete?.(code);
      
      toast({
        title: "Upload successful!",
        description: `${files.length} files uploaded with code: ${code}`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFiles([]);
    setUploadCode(null);
    setUploadProgress(0);
    setBurnAfterDownload(false);
  };

  if (uploadCode) {
    return (
      <div className="space-y-6">
        <CodeDisplay code={uploadCode} fileCount={files.length} burnAfterDownload={burnAfterDownload} />
        <Button onClick={resetUpload} variant="outline" className="w-full">
          Upload More Files
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
            isDragOver
              ? 'border-primary bg-primary/5 shadow-glow'
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-medium mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-muted-foreground mb-6">
            Upload multiple files and get a single code to share
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </Card>

      {/* Burn After Download Option - Always visible */}
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="burn-after-download"
            checked={burnAfterDownload}
            onCheckedChange={(checked) => setBurnAfterDownload(checked === true)}
          />
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-destructive" />
            <label
              htmlFor="burn-after-download"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Burn after 1st download
            </label>
          </div>
          <div className="text-xs text-muted-foreground ml-auto">
            Files will be permanently deleted after first download
          </div>
        </div>
      </Card>

      {files.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Selected Files ({files.length})</h4>
            <Button
              onClick={() => setFiles([])}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              Clear All
            </Button>
          </div>
          
          <div className="space-y-3 mb-6">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <FilePreview file={file} />
                <Button
                  onClick={() => removeFile(index)}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading}
            size="lg"
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </Card>
      )}
    </div>
  );
};