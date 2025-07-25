-- Update the function to fix search path security warning
CREATE OR REPLACE FUNCTION public.handle_file_download(file_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, storage
LANGUAGE plpgsql AS $$
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
$$;