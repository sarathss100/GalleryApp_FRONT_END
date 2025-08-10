import React, { useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface IImage {
  _id: string;
  userId: string;
  title: string;
  imagePath: string;
  uploadedAt: string;
}

interface ImageCardProps {
  image: IImage;
  onEdit: (image: IImage) => void;
  onDelete: (image: IImage) => void;
  className?: string;
  imageClassName?: string;
  editButtonClassName?: string;
  deleteButtonClassName?: string;
  iconSize?: number;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onEdit,
  onDelete,
  className = '',
  imageClassName = 'w-full h-48 object-cover transition-all duration-200',
  editButtonClassName = 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 z-20 shadow-lg shadow-emerald-500/25',
  deleteButtonClassName = 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 z-20 shadow-lg shadow-red-500/25',
  iconSize = 16,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(image);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(image);
  };

  return (
    <div
      className={`bg-gradient-to-br from-slate-800/90 via-gray-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden transform transition-all hover:scale-105 relative border border-slate-700/50 hover:shadow-emerald-500/10 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img src={image.imagePath} alt={image.title} className={imageClassName} />
        
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center gap-4 transition-all duration-200 bg-slate-900/50 backdrop-blur-sm">
            <button
              onClick={handleEdit}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={editButtonClassName}
              title="Edit Image"
            >
              <FaEdit size={iconSize} />
            </button>
            <button
              onClick={handleDelete}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={deleteButtonClassName}
              title="Delete Image"
            >
              <FaTrash size={iconSize} />
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-emerald-300">{image.title}</h3>
      </div>
    </div>
  );
};

export default ImageCard;