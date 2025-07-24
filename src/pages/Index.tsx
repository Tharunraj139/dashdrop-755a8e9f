import { useState } from 'react';
import { Share2, Upload, Download, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { FileDownload } from '@/components/FileDownload';
import heroBg from '@/assets/hero-bg.jpg';

const Index = () => {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                <Share2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              InstantShare
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Share files instantly with a simple 6-digit code. No registration required, 
              files auto-delete after 1 hour for maximum privacy.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center shadow-soft hover:shadow-medium transition-all duration-300">
              <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Quick Upload</h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop multiple files, get instant code
              </p>
            </Card>
            <Card className="p-6 text-center shadow-soft hover:shadow-medium transition-all duration-300">
              <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                No registration needed, files encrypted in transit
              </p>
            </Card>
            <Card className="p-6 text-center shadow-soft hover:shadow-medium transition-all duration-300">
              <Clock className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Auto-Delete</h3>
              <p className="text-sm text-muted-foreground">
                Files automatically deleted after 1 hour
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <Card className="max-w-4xl mx-auto shadow-medium">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted">
              <TabsTrigger 
                value="upload" 
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger 
                value="download"
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Files
              </TabsTrigger>
            </TabsList>
            
            <div className="p-8">
              <TabsContent value="upload" className="mt-0">
                <FileUpload onUploadComplete={(code) => console.log('Upload complete:', code)} />
              </TabsContent>
              
              <TabsContent value="download" className="mt-0">
                <FileDownload />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 InstantShare. Files are automatically deleted after 1 hour.</p>
            <p className="mt-2">Built with security and privacy in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
