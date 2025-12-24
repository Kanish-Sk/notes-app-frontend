import React, { useState, useEffect } from 'react';
import { FiImage, FiTrash2, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

const CloudinaryManager = () => {
    const { accessToken } = useAuth();
    const { addToast } = useToast();

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [totalImages, setTotalImages] = useState(0);

    const loadImages = async () => {
        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await axios.get(
                `${API_URL}/api/cloudinary/images`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            setImages(response.data.images || []);
            setTotalImages(response.data.total_images || 0);
        } catch (error) {
            console.error('Error loading images:', error);
            addToast('Failed to load images', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadImages();
    }, []);

    const handleDelete = async (imageUrl, publicId) => {
        if (!confirm(`Delete this image from Cloudinary?\n\nPublic ID: ${publicId}\n\nThis action cannot be undone!`)) {
            return;
        }

        setDeleting(imageUrl);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await axios.delete(
                `${API_URL}/api/cloudinary/image`,
                {
                    params: { image_url: imageUrl },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            if (response.data.success) {
                addToast('Image deleted successfully!', 'success');
                // Remove from list
                setImages(images.filter(img => img.url !== imageUrl));
                setTotalImages(totalImages - 1);
            } else {
                addToast(response.data.message || 'Failed to delete image', 'error');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            addToast('Failed to delete image', 'error');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <FiRefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading images...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Manage Cloudinary Images
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    View and manage images uploaded to your Cloudinary account
                </p>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center gap-4">
                    <FiImage className="w-12 h-12" />
                    <div>
                        <h2 className="text-3xl font-bold">{totalImages}</h2>
                        <p className="text-indigo-100">Total Images</p>
                    </div>
                </div>
            </div>

            {/* Images List */}
            {images.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <FiImage className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No Images Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        You haven't uploaded any images to Cloudinary yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {images.map((image) => (
                        <div
                            key={image.url}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                {/* Image Preview */}
                                <img
                                    src={image.url}
                                    alt={image.public_id}
                                    className="w-24 h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">No Image</text></svg>';
                                    }}
                                />

                                {/* Image Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                                        {image.public_id}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                                        {image.url}
                                    </p>

                                    {/* Usage Info */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                                            Used in {image.usage_count} {image.usage_count === 1 ? 'note' : 'notes'}
                                        </span>
                                    </div>

                                    {/* Notes List */}
                                    {image.used_in_notes.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Used in:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {image.used_in_notes.map((note, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                                    >
                                                        {note.note_title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDelete(image.url, image.public_id)}
                                    disabled={deleting === image.url}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete from Cloudinary"
                                >
                                    {deleting === image.url ? (
                                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <FiTrash2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            {/* Warning if used in notes */}
                            {image.usage_count > 0 && (
                                <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <FiAlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        <strong>Warning:</strong> This image is currently used in {image.usage_count} {image.usage_count === 1 ? 'note' : 'notes'}.
                                        Deleting it will break the image references in those notes.
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Refresh Button */}
            <div className="mt-6 text-center">
                <button
                    onClick={loadImages}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
                >
                    <FiRefreshCw className="w-4 h-4" />
                    Refresh List
                </button>
            </div>
        </div>
    );
};

export default CloudinaryManager;
