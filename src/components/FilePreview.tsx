import { FileText, Image, Video, Music, Archive, File } from 'lucide-react';

interface FilePreviewProps {
  file: File;
}

export const FilePreview = ({ file }: FilePreviewProps) => {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5 text-green-500" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return <Archive className="w-5 h-5 text-orange-500" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center space-x-3">
      {getFileIcon(file.type)}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.name}</p>
        <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
    </div>
  );
};