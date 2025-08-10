import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { updateImage } from '../services/userApi'; 
import { toast } from 'react-toastify';

interface IImage {
  _id: string;
  userId: string;
  title: string;
  imagePath: string;
  uploadedAt: string;
  order: number; 
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: IImage | null;
  onUpdate: (updatedImage: IImage) => void;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, image, onUpdate }) => {
  const [editData, setEditData] = useState<{ title: string; file: File | null }>({
    title: '',
    file: null,
  });
  const [errors, setErrors] = useState<{ title?: string; api?: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (image && isOpen) {
      setEditData({
        title: image.title,
        file: null,
      });
      setErrors({});
    }
  }, [image, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { title?: string } = {};

    if (!editData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setEditData(prev => ({ ...prev, file }));
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setEditData(prev => ({ ...prev, title }));
  };

  const handleUpdate = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!validateForm() || !image) return;

    const formData = new FormData();
    formData.append('title', editData.title);
    
    if (editData.file) {
      formData.append('image', editData.file);
    }

    setIsLoading(true);
    try {
      const response = await updateImage(image._id, formData);
      
      if (response.success) {
        const updatedImage: IImage = response.data;
        onUpdate(updatedImage);
        
        setEditData({ title: '', file: null });
        
        const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        onClose();
        toast.success(response.message || 'Image updated successfully');
      } else {
        setErrors({ api: response.message || 'Failed to update image' });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setErrors({ api: 'An error occurred while updating the image' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEditData({ title: '', file: null });
    setErrors({});
    
    const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
    onClose();
  };

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-40"></div>
      
      <div className="relative bg-gradient-to-br from-slate-800/90 via-gray-800/90 to-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md z-50 animate-modal-popup border border-slate-700/50">
        {/* Glowing top border */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"></div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text tracking-tight">
            Edit Image
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-emerald-300 transition-colors duration-300 p-2 rounded-full hover:bg-slate-700/50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <img 
              src={image.imagePath} 
              alt={image.title} 
              className="w-full h-32 object-cover rounded-xl border border-slate-600/50 shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent rounded-xl pointer-events-none"></div>
          </div>
          <p className="text-sm text-emerald-300 mt-3 font-medium">Current Image</p>
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

        <div className="space-y-5">
          <div className="group">
            <label htmlFor="edit-title" className="block text-sm font-semibold text-emerald-300 mb-2">
              Title
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors duration-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={editData.title}
                onChange={handleTitleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm"
                placeholder="Enter image title"
              />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
            </div>
            {errors.title && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.title}
              </p>
            )}
          </div>
          
          <div className="group">
            <label htmlFor="edit-image-upload" className="block text-sm font-semibold text-emerald-300 mb-2">
              Replace Image (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                id="edit-image-upload"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 file:transition-all file:duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Leave empty to keep current image</p>
          </div>
          
          <div className="flex gap-3 pt-6">
            <button
              onClick={handleClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={isLoading}
              className={`flex-1 relative py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:scale-105 focus:outline-none ${
                isLoading 
                  ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                <span>
                  {isLoading ? 'Updating...' : 'Update Image'}
                </span>
              </div>
              {!isLoading && (
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

export default EditModal;