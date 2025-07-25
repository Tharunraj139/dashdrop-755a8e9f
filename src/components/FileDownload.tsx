import { useState } from 'react';
import { Download, Search, FileX, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { FilePreview } from './FilePreview';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FileInfo {
  id: string;
  name: string;
  original_filename: string;
  size: number;
  type: string;
  storage_path: string;
  burn_after_download: boolean;
}

export const FileDownload = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [burnAfterDownload, setBurnAfterDownload] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [codeFound, setCodeFound] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-character code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Query files from database
      const { data: filesData, error } = await supabase
        .from('files')
        .select('*')
        .eq('filename', code)
        .eq('is_burned', false)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      if (filesData && filesData.length > 0) {
        const fileInfos: FileInfo[] = filesData.map(file => ({
          id: file.id,
          name: file.original_filename,
          original_filename: file.original_filename,
          size: file.file_size,
          type: file.mime_type,
          storage_path: file.storage_path,
          burn_after_download: file.burn_after_download
        }));

        setFiles(fileInfos);
        setBurnAfterDownload(filesData[0].burn_after_download);
        setCodeFound(true);
        
        toast({
          title: "Files found!",
          description: `Found ${filesData.length} files ready for download${filesData[0].burn_after_download ? ' (will be deleted after download)' : ''}`,
        });
      } else {
        setFiles([]);
        setCodeFound(true);
        toast({
          title: "No files found",
          description: "The code may have expired or the files have been deleted",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "There was an error searching for files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (files.length === 0) return;

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const progressPerFile = 100 / files.length;
      let currentProgress = 0;

      for (const file of files) {
        // Download file from storage
        const { data, error } = await supabase.storage
          .from('files')
          .download(file.storage_path);

        if (error) {
          throw error;
        }

        // Create download link
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Update progress
        currentProgress += progressPerFile;
        setDownloadProgress(Math.min(currentProgress, 100));

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Handle burn after download using the database function
      if (burnAfterDownload && files.length > 0) {
        for (const file of files) {
          const { error } = await supabase.rpc('handle_file_download', {
            file_id: file.id
          });

          if (error) {
            console.error('Error handling file download:', error);
          }
        }

        toast({
          title: "Download complete!",
          description: "Files have been downloaded and permanently deleted from the server",
        });

        // Clear files and reset state
        setTimeout(() => {
          setFiles([]);
          setCodeFound(false);
          setCode('');
        }, 2000);
      } else {
        // Just increment download count for non-burn files
        for (const file of files) {
          const { error } = await supabase.rpc('handle_file_download', {
            file_id: file.id
          });

          if (error) {
            console.error('Error updating download count:', error);
          }
        }

        toast({
          title: "Download complete!",
          description: "Your files have been downloaded successfully",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (files.length === 0) return;

    try {
      // Delete files from storage and mark as burned in database
      for (const file of files) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([file.storage_path]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }

        // Mark as burned in database
        const { error: dbError } = await supabase
          .from('files')
          .update({ is_burned: true })
          .eq('id', file.id);

        if (dbError) {
          console.error('Database update error:', dbError);
        }
      }

      toast({
        title: "Files deleted",
        description: "The files and code have been removed from the server",
      });
      
      setFiles([]);
      setCodeFound(false);
      setCode('');
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the files. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="text-center mb-8">
          <Search className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Download Files</h2>
          <p className="text-muted-foreground">
            Enter the 6-digit code to access your files
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <div className="flex space-x-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="text-center text-lg font-mono tracking-wider"
            />
            <Button
              onClick={handleSearch}
              disabled={loading || code.length !== 6}
              className="bg-gradient-primary hover:shadow-glow"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
      </Card>

      {codeFound && files.length > 0 && (
        <Card className="p-6">
          {burnAfterDownload && (
            <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div className="text-sm">
                <span className="font-medium text-destructive">Warning:</span>
                <span className="text-muted-foreground ml-1">
                  These files will be permanently deleted after download
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Available Files ({files.length})</h3>
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Files
            </Button>
          </div>

          <div className="space-y-3 mb-6">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <FilePreview file={{ name: file.original_filename, type: file.type, size: file.size } as File} />
                <span className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>

          {downloading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Downloading...</span>
                <span className="text-sm text-muted-foreground">{Math.round(downloadProgress)}%</span>
              </div>
              <Progress value={downloadProgress} className="w-full" />
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="lg"
            className="w-full bg-gradient-primary hover:shadow-glow"
          >
            <Download className="w-5 h-5 mr-2" />
            {downloading ? 'Downloading...' : `Download All Files${burnAfterDownload ? ' (Will Delete)' : ''}`}
          </Button>
        </Card>
      )}

      {codeFound && files.length === 0 && (
        <Card className="p-8 text-center">
          <FileX className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-medium mb-2">No Files Found</h3>
          <p className="text-muted-foreground">
            The code may have expired or the files have been deleted
          </p>
        </Card>
      )}
    </div>
  );
};