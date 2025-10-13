import { cloudinaryConfig } from '@/lib/cloudinary.config';

export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export class CloudinaryUploadService {
  /**
   * Valida arquivo antes do upload
   */
  private static validateFile(file: File): void {
    // Validar tamanho
    if (file.size > cloudinaryConfig.maxFileSize) {
      const maxSizeMB = cloudinaryConfig.maxFileSize / (1024 * 1024);
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
    }

    // Validar formato
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !cloudinaryConfig.allowedFormats.includes(fileExtension)) {
      throw new Error(
        `Formato não suportado. Formatos aceitos: ${cloudinaryConfig.allowedFormats.join(', ')}`
      );
    }

    // Validar tipo MIME
    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem');
    }
  }

  /**
   * Faz upload de imagem para Cloudinary (unsigned)
   */
  static async uploadImage(file: File): Promise<string> {
    try {
      // Validar arquivo
      this.validateFile(file);

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      formData.append('folder', cloudinaryConfig.folder);

      // Fazer upload
      const response = await fetch(cloudinaryConfig.apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erro ao fazer upload da imagem');
      }

      const data: CloudinaryUploadResponse = await response.json();

      // Retornar URL otimizada
      const optimizedUrl = data.secure_url.replace(
        '/upload/',
        `/upload/${cloudinaryConfig.optimizationTransform}/`
      );

      return optimizedUrl;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido ao fazer upload da imagem');
    }
  }

  /**
   * Extrai public_id de uma URL Cloudinary
   */
  static extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\./);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }
}