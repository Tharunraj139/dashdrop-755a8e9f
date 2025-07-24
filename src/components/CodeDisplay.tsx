import { useState } from 'react';
import { Copy, Check, Download, Clock, Files, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface CodeDisplayProps {
  code: string;
  fileCount: number;
  burnAfterDownload?: boolean;
}

export const CodeDisplay = ({ code, fileCount, burnAfterDownload }: CodeDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Code copied!",
        description: "Share this code to let others download your files",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-8 text-center bg-gradient-success shadow-success">
      <div className="mb-6">
        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-success mb-2">Upload Complete!</h2>
        <p className="text-success-foreground/80">
          {fileCount === 1 ? 'Your file is' : `Your ${fileCount} files are`} ready to share
        </p>
      </div>

      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Files className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Download Code</span>
        </div>
        
        <div className="text-4xl font-mono font-bold tracking-wider text-primary mb-4">
          {code}
        </div>
        
        <Button
          onClick={copyCode}
          variant="outline"
          className="w-full"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Expires in 1 hour</span>
        </div>
        <div className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
        </div>
        {burnAfterDownload && (
          <div className="flex items-center space-x-2 text-destructive">
            <Flame className="w-4 h-4" />
            <span>Burns after 1st download</span>
          </div>
        )}
      </div>
    </Card>
  );
};