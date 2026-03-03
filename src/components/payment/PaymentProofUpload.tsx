
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, X, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface PaymentProofUploadProps {
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
}

export const PaymentProofUpload: React.FC<PaymentProofUploadProps> = ({ required, value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const path = `proofs/${uuidv4()}.${ext}`;
      const { error } = await supabase.storage.from('payment-proofs').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(path);
      onChange(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase text-muted-foreground">
        Payment Proof {required ? '*' : '(Optional)'}
      </Label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Payment proof" className="h-16 w-16 object-cover rounded border" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
          {uploading ? 'Uploading...' : 'Upload Screenshot'}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
