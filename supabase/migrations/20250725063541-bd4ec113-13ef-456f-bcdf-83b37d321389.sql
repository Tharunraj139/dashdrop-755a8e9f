-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('files', 'files', true);

-- Create files table to track uploads and downloads
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  burn_after_download BOOLEAN NOT NULL DEFAULT false,
  download_count INTEGER NOT NULL DEFAULT 0,
  is_burned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view files (for downloads)
CREATE POLICY "Anyone can view files" 
ON public.files 
FOR SELECT 
USING (NOT is_burned);

-- Allow anyone to insert files (for uploads)
CREATE POLICY "Anyone can upload files" 
ON public.files 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update download count and burn status
CREATE POLICY "Anyone can update file status" 
ON public.files 
FOR UPDATE 
USING (true);

-- Storage policies for files bucket
CREATE POLICY "Anyone can view files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'files');

CREATE POLICY "Anyone can upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'files');

CREATE POLICY "Anyone can update files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'files');

CREATE POLICY "Anyone can delete files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'files');

-- Function to handle file download and burning
CREATE OR REPLACE FUNCTION public.handle_file_download(file_id UUID)
RETURNS JSONB AS $$
DECLARE
  file_record RECORD;
  result JSONB;
BEGIN
  -- Get file record
  SELECT * INTO file_record FROM public.files WHERE id = file_id AND NOT is_burned;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'File not found or already burned');
  END IF;
  
  -- Increment download count
  UPDATE public.files 
  SET download_count = download_count + 1
  WHERE id = file_id;
  
  -- If burn after download is enabled, mark as burned and delete from storage
  IF file_record.burn_after_download THEN
    UPDATE public.files 
    SET is_burned = true
    WHERE id = file_id;
    
    -- Delete from storage
    DELETE FROM storage.objects 
    WHERE bucket_id = 'files' AND name = file_record.storage_path;
    
    result := jsonb_build_object(
      'success', true, 
      'file', row_to_json(file_record),
      'burned', true
    );
  ELSE
    result := jsonb_build_object(
      'success', true, 
      'file', row_to_json(file_record),
      'burned', false
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;