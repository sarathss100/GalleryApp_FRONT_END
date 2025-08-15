import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { uploadImage } from '../services/userApi';
import { toast } from 'react-toastify';

interface IImage {
  _id: string;
  userId: string;
  title: string;
  imagePath: string;
  uploadedAt: string;
  order: number;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (newImages: IImage[]) => void;
}

interface ValidationErrors {
  titles?: string[];
  files?: string;
  api?: string;
  fileSize?: string[];
  fileType?: string[];
  general?: string;
}

interface ImageFile {
  file: File | null;
  title: string;
  error?: string;
  preview?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Configuration constants
  const MAX_IMAGES = 10;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
  const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_TITLE_LENGTH = 100;
  const MIN_TITLE_LENGTH = 3;

  // Utility functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: ${ALLOWED_TYPES.map(type => type.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`;
    }

    // Check if file is corrupted (size is 0)
    if (file.size === 0) {
      return 'File appears to be corrupted or empty';
    }

    return null;
  };

  const validateTotalSize = (files: File[]): boolean => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return totalSize <= MAX_TOTAL_SIZE;
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newErrors: ValidationErrors = {};

    // Check if any files selected
    if (selectedFiles.length === 0) {
      setImages([]);
      setErrors({});
      return;
    }

    // Check maximum number of images
    if (selectedFiles.length > MAX_IMAGES) {
      newErrors.files = `You can upload a maximum of ${MAX_IMAGES} images at a time.`;
      setErrors(newErrors);
      return;
    }

    // Validate individual files
    const validFiles: File[] = [];
    const fileErrors: string[] = [];
    const fileSizeErrors: string[] = [];
    const fileTypeErrors: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const error = validateFile(file);
      
      if (error) {
        if (error.includes('file type')) {
          fileTypeErrors[i] = error;
        } else if (error.includes('too large') || error.includes('corrupted')) {
          fileSizeErrors[i] = error;
        }
        fileErrors[i] = error;
      } else {
        validFiles.push(file);
      }
    }

    // Check total size
    if (validFiles.length > 0 && !validateTotalSize(validFiles)) {
      newErrors.general = `Total file size exceeds limit of ${formatFileSize(MAX_TOTAL_SIZE)}`;
    }

    // Set errors if any
    if (fileErrors.some(error => error) || newErrors.general) {
      setErrors({
        ...newErrors,
        fileSize: fileSizeErrors,
        fileType: fileTypeErrors
      });
      
      // Clear the input
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      return;
    }

    // Create image objects with previews
    try {
      const imagePromises = selectedFiles.map(async (file, index) => {
        const preview = await createPreview(file);
        return {
          file,
          title: '',
          preview,
          error: fileErrors[index] || undefined
        };
      });

      const imageObjects = await Promise.all(imagePromises);
      setImages(imageObjects);
      setErrors({}); // Clear previous errors
    } catch (error) {
      console.error('Error creating previews:', error);
      newErrors.general = 'Error processing selected files';
      setErrors(newErrors);
    }
  };

  const handleTitleChange = (index: number, value: string) => {
    // Prevent exceeding max length
    if (value.length > MAX_TITLE_LENGTH) {
      return;
    }

    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], title: value };
      return newImages;
    });

    // Clear title error for this specific image
    if (errors.titles && errors.titles[index]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.titles) {
          newErrors.titles[index] = '';
        }
        return newErrors;
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Clean up errors for removed image
    setErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors.titles) {
        newErrors.titles.splice(index, 1);
      }
      if (newErrors.fileSize) {
        newErrors.fileSize.splice(index, 1);
      }
      if (newErrors.fileType) {
        newErrors.fileType.splice(index, 1);
      }
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = { titles: [] };

    if (images.length === 0) {
      newErrors.files = 'Please select at least one image to upload';
      setErrors(newErrors);
      return false;
    }

    let hasValidationErrors = false;

    images.forEach((img, index) => {
      const title = img.title.trim();
      
      if (!title) {
        newErrors.titles![index] = 'Title is required';
        hasValidationErrors = true;
      } else if (title.length < MIN_TITLE_LENGTH) {
        newErrors.titles![index] = `Title must be at least ${MIN_TITLE_LENGTH} characters long`;
        hasValidationErrors = true;
      } else if (title.length > MAX_TITLE_LENGTH) {
        newErrors.titles![index] = `Title must be less than ${MAX_TITLE_LENGTH} characters`;
        hasValidationErrors = true;
      }

      // Check for duplicate titles
      const duplicateIndex = images.findIndex((otherImg, otherIndex) => 
        otherIndex !== index && otherImg.title.trim().toLowerCase() === title.toLowerCase()
      );
      
      if (duplicateIndex !== -1) {
        newErrors.titles![index] = 'Title must be unique';
        hasValidationErrors = true;
      }

      // Re-validate file if it exists
      if (img.file) {
        const fileError = validateFile(img.file);
        if (fileError) {
          hasValidationErrors = true;
        }
      }
    });

    setErrors(newErrors);
    return !hasValidationErrors;
  };

  const handleUpload = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    const formData = new FormData();
    
    // Add images
    images.forEach((img) => {
      if (img.file) {
        formData.append('image', img.file);
      }
    });
    
    // Add titles
    const titles = images.map(img => img.title.trim());
    formData.append('titles', JSON.stringify(titles));

    setIsLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      const response = await uploadImage(formData);

      if (response && response.success) {
        const uploadedImages: IImage[] = response.data;
        onUpload(uploadedImages);
        
        // Reset form
        setImages([]);
        const fileInput = document.getElementById('image-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        onClose();
        toast.success(response.message || 'Images uploaded successfully');
      } else {
        setErrors({ api: response?.message || 'Failed to upload images' });
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'An error occurred while uploading the images';
      setErrors({ api: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setImages([]);
    setErrors({});
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-40" onClick={handleClose}></div>
      <div className="relative bg-gradient-to-br from-slate-800/90 via-gray-800/90 to-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-2xl z-50 animate-modal-popup max-h-[90vh] overflow-y-auto border border-slate-700/50">
        {/* Glowing top border */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"></div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text tracking-tight">
              Upload Images
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Max {MAX_IMAGES} images, {formatFileSize(MAX_FILE_SIZE)} per file, {formatFileSize(MAX_TOTAL_SIZE)} total
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-emerald-300 transition-colors duration-300 p-2 rounded-full hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error messages */}
        {(errors.api || errors.files || errors.general) && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-3 backdrop-blur-sm">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm">{errors.api || errors.files || errors.general}</span>
          </div>
        )}

        <div className="space-y-5">
          <div className="group">
            <label htmlFor="image-upload" className="block text-sm font-semibold text-emerald-300 mb-2">
              Select Images
            </label>
            <div className="relative">
              <input
                type="file"
                id="image-upload"
                name="images"
                accept={ALLOWED_TYPES.join(',')}
                multiple
                onChange={handleFileChange}
                disabled={isLoading}
                className="w-full p-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 file:transition-all file:duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
            </div>
          </div>
          
          {images.map((img, index) => (
            <div key={index} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-3">
                {img.preview && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-600 flex-shrink-0">
                    <img 
                      src={img.preview} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300 truncate">
                      {img.file?.name || `Image ${index + 1}`}
                    </span>
                    <button
                      onClick={() => removeImage(index)}
                      disabled={isLoading}
                      className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {img.file && (
                    <p className="text-xs text-slate-400 mb-2">
                      Size: {formatFileSize(img.file.size)} | Type: {img.file.type.split('/')[1].toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="group">
                <label htmlFor={`title-${index}`} className="block text-sm font-semibold text-emerald-300 mb-2">
                  Title ({img.title.length}/{MAX_TITLE_LENGTH})
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id={`title-${index}`}
                    value={img.title}
                    onChange={(e) => handleTitleChange(index, e.target.value)}
                    disabled={isLoading}
                    className="w-full p-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={`Enter title for image ${index + 1}`}
                    maxLength={MAX_TITLE_LENGTH}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                </div>
                {errors.titles && errors.titles[index] && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.titles[index]}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={isLoading || images.length === 0}
              className="sm:w-auto px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              onClick={handleUpload}
              disabled={isLoading || images.length === 0}
              className={`flex-1 relative py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:scale-105 focus:outline-none ${
                isLoading || images.length === 0 
                  ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                {isLoading && (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                <span className="text-lg">
                  {isLoading ? 'Uploading...' : `Upload ${images.length} Image${images.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              {!isLoading && !(images.length === 0) && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
              )}
            </button>
          </div>
        </div>

        {/* Bottom glow effect */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-30"></div>
      </div>
    </div>
  );
};

export default UploadModal;