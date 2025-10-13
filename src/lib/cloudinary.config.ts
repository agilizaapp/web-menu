export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
  apiUrl: `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,

  // Configurações padrão
  folder: 'products',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],

  // Transformações de otimização (aplicadas automaticamente)
  optimizationTransform: 'q_auto,f_auto,w_800,h_600,c_limit',
};

// Validação
if (!cloudinaryConfig.cloudName) {
  throw new Error('❌ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME não configurado');
}

if (!cloudinaryConfig.uploadPreset) {
  throw new Error('❌ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET não configurado');
}