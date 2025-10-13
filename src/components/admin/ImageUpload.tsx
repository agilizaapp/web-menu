'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CloudinaryUploadService } from '@/services/cloudinary/upload.service';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(value || '');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Preview local imediato
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // ✅ Upload para Cloudinary
      const imageUrl = await CloudinaryUploadService.uploadImage(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Atualizar URL final
      setPreviewUrl(imageUrl);
      onChange(imageUrl);

      toast.success('✅ Imagem enviada com sucesso!');
    } catch (error) {
      console.error('❌ Erro no upload:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao enviar imagem';

      setError(errorMessage);
      toast.error(errorMessage);

      // Resetar preview em caso de erro
      setPreviewUrl(value || '');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);

      // Limpar input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    setError(null);
    onChange('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }

    toast.info('Imagem removida');
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preview ou Upload Zone */}
      {previewUrl ? (
        <div className="relative group">
          <div className="relative w-full rounded-lg overflow-hidden bg-muted border-2 border-muted max-h-[400px]">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />

            {/* Loading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                <p className="text-white text-sm font-medium">
                  Enviando... {uploadProgress}%
                </p>
                <div className="w-48 h-1 bg-white/30 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Remove Button */}
          {!isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center
            ${disabled
              ? 'border-muted-foreground/20 cursor-not-allowed'
              : 'border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/50'
            }
            transition-colors
          `}
          onClick={handleClick}
        >
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium mb-1">
                  Enviando imagem... {uploadProgress}%
                </p>
                <div className="w-48 h-2 bg-muted rounded-full mx-auto overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Clique para selecionar uma imagem
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG ou WebP (máx. 5MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* Input escondido */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Upload Button (quando tem preview) */}
      {previewUrl && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleClick}
          disabled={disabled}
        >
          <Upload className="w-4 h-4 mr-2" />
          Alterar Imagem
        </Button>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Text */}
      <p className="text-xs text-muted-foreground text-center">
        A imagem será otimizada automaticamente (800x600px, qualidade automática)
      </p>
    </div>
  );
};