"use client"

import { useRef } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, Upload, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface ImagePreview {
  file?: File
  preview: string
  altText: string
  url?: string
}

interface ImageUploadProps {
  images: ImagePreview[]
  onChange: (images: ImagePreview[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = maxImages - images.length
    const filesToAdd = files.slice(0, remainingSlots)

    const newImages: ImagePreview[] = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      altText: file.name.replace(/\.[^/.]+$/, ""),
    }))

    onChange([...images, ...newImages])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const imageToRemove = images[index]
    if (imageToRemove.preview && !imageToRemove.url) {
      URL.revokeObjectURL(imageToRemove.preview)
    }
    onChange(newImages)
  }

  const updateAltText = (index: number, altText: string) => {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], altText }
    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Product Images
          <span className="text-muted-foreground ml-2">
            ({images.length}/{maxImages})
          </span>
        </Label>
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Images
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Click to upload product images
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP up to 5MB (max {maxImages} images)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="space-y-2">
              <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                <Image
                  src={image.url || image.preview}
                  alt={image.altText || `Product image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
              <input
                type="text"
                value={image.altText}
                onChange={(e) => updateAltText(index, e.target.value)}
                placeholder="Alt text"
                className="w-full text-xs px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
