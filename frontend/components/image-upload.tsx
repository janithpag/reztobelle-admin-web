'use client';

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { uploadAPI } from '@/lib/api';

interface UploadedImage {
	public_id: string;
	url: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	bytes: number;
}

interface ImageUploadProps {
	onImagesChange: (images: UploadedImage[]) => void;
	initialImages?: UploadedImage[];
	maxImages?: number;
	maxFileSize?: number; // in MB
	acceptedFormats?: string[];
	className?: string;
}

export function ImageUpload({
	onImagesChange,
	initialImages = [],
	maxImages = 5,
	maxFileSize = 10,
	acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
	className = '',
}: ImageUploadProps) {
	const [images, setImages] = useState<UploadedImage[]>(initialImages);
	const [isDragging, setIsDragging] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
	const [uploading, setUploading] = useState<string[]>([]);
	const [errors, setErrors] = useState<string[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateFile = useCallback((file: File): string | null => {
		if (!acceptedFormats.includes(file.type)) {
			return `Invalid file format. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`;
		}
		
		if (file.size > maxFileSize * 1024 * 1024) {
			return `File size must be less than ${maxFileSize}MB`;
		}
		
		if (images.length >= maxImages) {
			return `Maximum ${maxImages} images allowed`;
		}
		
		return null;
	}, [acceptedFormats, maxFileSize, images.length, maxImages]);

	const uploadFile = useCallback(async (file: File) => {
		const fileId = Math.random().toString(36).substr(2, 9);
		
		try {
			setUploading(prev => [...prev, fileId]);
			setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

			const result = await uploadAPI.uploadImage(file, (progress) => {
				setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
			});

			if (result.success && result.data) {
				const newImages = [...images, result.data];
				setImages(newImages);
				onImagesChange(newImages);
			} else {
				throw new Error(result.error || 'Upload failed');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Upload failed';
			setErrors(prev => [...prev, errorMessage]);
		} finally {
			setUploading(prev => prev.filter(id => id !== fileId));
			setUploadProgress(prev => {
				const newProgress = { ...prev };
				delete newProgress[fileId];
				return newProgress;
			});
		}
	}, [images, onImagesChange]);

	const handleFileSelect = useCallback(async (files: FileList | File[]) => {
		const fileArray = Array.from(files);
		const validFiles: File[] = [];
		const newErrors: string[] = [];

		fileArray.forEach(file => {
			const error = validateFile(file);
			if (error) {
				newErrors.push(`${file.name}: ${error}`);
			} else {
				validFiles.push(file);
			}
		});

		if (newErrors.length > 0) {
			setErrors(prev => [...prev, ...newErrors]);
		}

		// Upload valid files
		for (const file of validFiles) {
			await uploadFile(file);
		}
	}, [validateFile, uploadFile]);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			handleFileSelect(files);
		}
	}, [handleFileSelect]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			handleFileSelect(e.target.files);
		}
	}, [handleFileSelect]);

	const removeImage = async (index: number) => {
		const imageToRemove = images[index];
		
		try {
			// Delete from Cloudinary
			await uploadAPI.deleteImage(imageToRemove.public_id);
			
			// Remove from local state
			const newImages = images.filter((_, i) => i !== index);
			setImages(newImages);
			onImagesChange(newImages);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
			setErrors(prev => [...prev, errorMessage]);
		}
	};

	const clearErrors = () => {
		setErrors([]);
	};

	const isUploading = uploading.length > 0;

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Upload Area */}
			<Card
				className={`border-2 border-dashed transition-colors cursor-pointer ${
					isDragging
						? 'border-primary bg-primary/5'
						: 'border-border hover:border-primary/50'
				} ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={() => fileInputRef.current?.click()}
			>
				<CardContent className="flex flex-col items-center justify-center py-8 px-4">
					{isUploading ? (
						<Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
					) : (
						<Upload className="h-8 w-8 text-muted-foreground mb-2" />
					)}
					<p className="text-sm text-center text-muted-foreground mb-2">
						{isUploading
							? 'Uploading images...'
							: 'Drag and drop images here, or click to select'}
					</p>
					<p className="text-xs text-muted-foreground">
						Max {maxImages} images, up to {maxFileSize}MB each
					</p>
					{Object.values(uploadProgress).some(progress => progress > 0) && (
						<div className="w-full max-w-xs mt-3">
							{Object.entries(uploadProgress).map(([fileId, progress]) => (
								<Progress key={fileId} value={progress} className="h-2" />
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<input
				ref={fileInputRef}
				type="file"
				multiple
				accept={acceptedFormats.join(',')}
				onChange={handleInputChange}
				className="hidden"
			/>

			{/* Error Messages */}
			{errors.length > 0 && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<div className="space-y-1">
							{errors.map((error, index) => (
								<p key={index} className="text-sm">
									{error}
								</p>
							))}
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={clearErrors}
							className="mt-2"
						>
							Clear Errors
						</Button>
					</AlertDescription>
				</Alert>
			)}

			{/* Image Preview Grid */}
			{images.length > 0 && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{images.map((image, index) => (
						<Card key={image.public_id} className="relative group">
							<CardContent className="p-2">
								<div className="aspect-square relative overflow-hidden rounded-md">
									<Image
										src={image.secure_url}
										alt={`Product image ${index + 1}`}
										fill
										className="object-cover"
										sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
									/>
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
									<Button
										variant="destructive"
										size="sm"
										className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={(e) => {
											e.stopPropagation();
											removeImage(index);
										}}
									>
										<X className="h-3 w-3" />
									</Button>
								</div>
								<div className="mt-2 text-xs text-muted-foreground truncate">
									{image.format.toUpperCase()} • {Math.round(image.bytes / 1024)}KB
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Empty State */}
			{images.length === 0 && !isUploading && (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-8">
						<ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
						<p className="text-sm text-muted-foreground">No images uploaded yet</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}