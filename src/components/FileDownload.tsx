import { useState } from 'react';
import { Download, Search, FileX, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { FilePreview } from './FilePreview';
import { useToast } from '@/hooks/use-toast';

interface FileInfo {
  name: string;
  size: number;
  type: string;
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

  // Mock file data for demo
  const mockFiles: FileInfo[] = [
    { name: 'presentation.pdf', size: 2457600, type: 'application/pdf' },
    { name: 'image.jpg', size: 1048576, type: 'image/jpeg' },
    { name: 'document.docx', size: 524288, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
  ];

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
    
    // Simulate API call
    setTimeout(() => {
      // For demo, accept any 6-character code
      const isBurnEnabled = localStorage.getItem(`burn_${code}`) === 'true';
      setBurnAfterDownload(isBurnEnabled);
      setFiles(mockFiles);
      setCodeFound(true);
      setLoading(false);
      toast({
        title: "Files found!",
        description: `Found ${mockFiles.length} files ready for download${isBurnEnabled ? ' (will be deleted after download)' : ''}`,
      });
    }, 1000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Simulate download completion
    setTimeout(() => {
      clearInterval(interval);
      setDownloadProgress(100);
      setDownloading(false);
      
      // If burn after download is enabled, simulate file deletion
      if (burnAfterDownload) {
        toast({
          title: "Download complete!",
          description: "Files have been downloaded and permanently deleted from the server",
        });
        // Clear files and reset state
        setTimeout(() => {
          setFiles([]);
          setCodeFound(false);
          setCode('');
          localStorage.removeItem(`burn_${code}`);
        }, 2000);
      } else {
        toast({
          title: "Download complete!",
          description: "Your files have been downloaded successfully",
        });
      }
    }, 3000);
  };

  const handleDelete = async () => {
    toast({
      title: "Files deleted",
      description: "The files and code have been removed from the server",
    });
    setFiles([]);
    setCodeFound(false);
    setCode('');
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
                <FilePreview file={file as File} />
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