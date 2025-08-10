import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaEdit, FaTrash, FaGripVertical } from 'react-icons/fa';
import UploadModal from '../components/uploadModal';
import EditModal from '../components/editModal';
import DeleteConfirmModal from '../components/deleteModal';
import { getImages, updateImageOrder, deleteImage } from '../services/userApi';
import { toast } from 'react-toastify';

interface IImage {
  _id: string;
  userId: string;
  title: string;
  imagePath: string;
  uploadedAt: string;
  order: number;
}

interface SortableImageProps {
  image: IImage;
  onEdit: (image: IImage) => void;
  onDelete: (image: IImage) => void;
  className?: string;
  imageClassName?: string;
  dragHandleClassName?: string;
  editButtonClassName?: string;
  deleteButtonClassName?: string;
  iconSize?: number;
}

const SortableImage: React.FC<SortableImageProps> = ({
  image,
  onEdit,
  onDelete,
  className = '',
  imageClassName = 'w-full h-48 object-cover transition-all duration-200',
  dragHandleClassName = 'absolute top-2 left-2 w-6 h-6 bg-slate-700/80 backdrop-blur-sm rounded cursor-move z-10 flex items-center justify-center border border-slate-600/50',
  editButtonClassName = 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 z-20 shadow-lg shadow-emerald-500/25',
  deleteButtonClassName = 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 z-20 shadow-lg shadow-red-500/25',
  iconSize = 16,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gradient-to-br from-slate-800/90 via-gray-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden transform transition-all hover:scale-105 relative border border-slate-700/50 hover:shadow-emerald-500/10 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div {...dragHandleProps} className={dragHandleClassName} title="Drag to reorder">
        <FaGripVertical className="text-emerald-300" size={iconSize} />
      </div>

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

const HomePage: React.FC = () => {
  const [images, setImages] = useState<IImage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<IImage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ api?: string }>({});
  const [isOrderChanged, setIsOrderChanged] = useState<boolean>(false);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const response = await getImages();
        if (response.success) {
          setImages(response.data);
        } else {
          setErrors({ api: 'Failed to load images' });
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setErrors({ api: 'An error occurred while loading images' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setImages((prevImages) => {
        const oldIndex = prevImages.findIndex((image) => image._id === active.id);
        const newIndex = prevImages.findIndex((image) => image._id === over.id);
        const reorderedImages = [...prevImages];
        const [movedImage] = reorderedImages.splice(oldIndex, 1);
        reorderedImages.splice(newIndex, 0, movedImage);
        return reorderedImages;
      });
      setIsOrderChanged(true);
    }
  };

  const handleSaveOrder = async () => {
    try {
      const imageOrder = images.map((image, index) => ({
        _id: image._id,
        order: index,
      }));
      const response = await updateImageOrder(imageOrder);
      if (response.success) {
        setIsOrderChanged(false);
        toast.success(response.message);
      } else {
        setErrors({ api: 'Failed to save image order' });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setErrors({ api: 'An error occurred while saving image order' });
    }
  };

  const handleImageUpload = (newImages: IImage[]) => {
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleEditImage = (image: IImage) => {
    setSelectedImage(image);
    setIsEditModalOpen(true);
  };

  const handleDeleteImage = (image: IImage) => {
    setSelectedImage(image);
    setIsDeleteModalOpen(true);
  };

  const handleImageUpdate = (updatedImage: IImage) => {
    setImages((prev) => 
      prev.map((img) => 
        img._id === updatedImage._id ? updatedImage : img
      )
    );
    setIsEditModalOpen(false);
    setSelectedImage(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedImage) return;

    try {
      const response = await deleteImage(selectedImage._id);
      if (response.success) {
        setImages((prev) => prev.filter((img) => img._id !== selectedImage._id));
        toast.success(response.message || 'Image deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete image');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('An error occurred while deleting the image');
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedImage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12 flex gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
          >
            Upload Images
          </button>
          {isOrderChanged && (
            <button
              onClick={handleSaveOrder}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40"
            >
              Save Order
            </button>
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text mb-6 tracking-tight">Gallery Images</h2>
          {errors.api && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-sm">{errors.api}</span>
            </div>
          )}
          {isLoading && images.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-emerald-300">
                <div className="w-6 h-6 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin"></div>
                <span className="text-lg">Loading images...</span>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400 text-lg">No images found. Upload your first image!</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={images.map((image) => image._id)} strategy={horizontalListSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {images.map((image) => (
                    <SortableImage 
                      key={image._id} 
                      image={image}
                      onEdit={handleEditImage}
                      onDelete={handleDeleteImage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>

      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleImageUpload}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedImage(null);
        }}
        image={selectedImage}
        onUpdate={handleImageUpdate}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedImage(null);
        }}
        onConfirm={handleConfirmDelete}
        imageName={selectedImage?.title || ''}
      />
    </div>
  );
};

export default HomePage;