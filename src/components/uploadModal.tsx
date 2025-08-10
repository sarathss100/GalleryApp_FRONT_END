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

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [images, setImages] = useState<{ file: File | null; title: string }[]>([]);
  const [errors, setErrors] = useState<{ titles?: string[]; files?: string; api?: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const MAX_IMAGES = 10;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES);
    if (files.length > MAX_IMAGES) {
      setErrors({ ...errors, files: `You can upload a maximum of ${MAX_IMAGES} images at a time.` });
      return;
    }
    setImages(files.map(file => ({ file, title: '' })));
    setErrors({ ...errors, files: undefined });
  };

  const handleTitleChange = (index: number, value: string) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], title: value };
      return newImages;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: { titles?: string[]; files?: string } = { titles: [] };

    if (images.length === 0) {
      newErrors.files = 'Please select at least one image to upload';
    }

    images.forEach((img, index) => {
      if (!img.title.trim()) {
        newErrors.titles![index] = 'Title is required';
      }
    });

    setErrors(newErrors);
    return !newErrors.files && (newErrors.titles?.length === 0 || !newErrors.titles?.some(error => error));
  };


  const handleUpload = async (e: FormEvent<HTMLButtonElement>) => {
  e.preventDefault();

  if (!validateForm()) return;

  const formData = new FormData();
  
  // Fix: Use "image" field name to match backend multer configuration
  images.forEach((img) => {
    if (img.file) {
      formData.append('image', img.file); // Changed from 'images[]' to 'image'
    }
  });
  
  // Add titles as a separate field or in request body
  const titles = images.map(img => img.title);
  formData.append('titles', JSON.stringify(titles));

  setIsLoading(true);
  try {
    const response = await uploadImage(formData);

    if (response && response.success) {
      const uploadedImages: IImage[] = response.data;
      onUpload(uploadedImages);
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



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-40"></div>
      <div className="relative bg-gradient-to-br from-slate-800/90 via-gray-800/90 to-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md z-50 animate-modal-popup max-h-[90vh] overflow-y-auto border border-slate-700/50">
        {/* Glowing top border */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"></div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text tracking-tight">
            Upload Images (Max {MAX_IMAGES})
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-emerald-300 transition-colors duration-300 p-2 rounded-full hover:bg-slate-700/50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errors.api && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-3 backdrop-blur-sm">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm">{errors.api}</span>
          </div>
        )}

        {errors.files && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-3 backdrop-blur-sm">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm">{errors.files}</span>
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
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="w-full p-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 file:transition-all file:duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
            </div>
          </div>
          
          {images.map((img, index) => (
            <div key={index} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-300 truncate flex-1">
                  {img.file?.name || `Image ${index + 1}`}
                </span>
              </div>
              
              <div className="group">
                <label htmlFor={`title-${index}`} className="block text-sm font-semibold text-emerald-300 mb-2">
                  Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id={`title-${index}`}
                    value={img.title}
                    onChange={(e) => handleTitleChange(index, e.target.value)}
                    className="w-full p-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm"
                    placeholder={`Enter title for image ${index + 1}`}
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
          
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleUpload}
              disabled={isLoading || images.length === 0}
              className={`w-full relative py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:scale-105 focus:outline-none ${
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
                  {isLoading ? 'Uploading...' : 'Upload Images'}
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