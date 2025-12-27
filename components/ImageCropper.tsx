"use client"

import { useState, useRef, useEffect } from "react"
import ReactCrop, { Crop, PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface ImageCropperProps {
    isOpen: boolean
    onClose: () => void
    imageFile: File
    requiredWidth: number
    requiredHeight: number
    onCropComplete: (croppedFile: File) => void
}

export function ImageCropper({
    isOpen,
    onClose,
    imageFile,
    requiredWidth,
    requiredHeight,
    onCropComplete,
}: ImageCropperProps) {
    const [imageSrc, setImageSrc] = useState<string>("")
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const [isProcessing, setIsProcessing] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)
    const aspectRatio = requiredWidth / requiredHeight

    useEffect(() => {
        if (imageFile) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImageSrc(reader.result as string)
            }
            reader.readAsDataURL(imageFile)
        }
    }, [imageFile])

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget

        // Calculate initial crop to match aspect ratio
        const cropWidth = width
        const cropHeight = width / aspectRatio

        if (cropHeight > height) {
            // If calculated height is too tall, fit by height instead
            const newCropHeight = height
            const newCropWidth = height * aspectRatio
            setCrop({
                unit: "px",
                x: (width - newCropWidth) / 2,
                y: 0,
                width: newCropWidth,
                height: newCropHeight,
            })
        } else {
            setCrop({
                unit: "px",
                x: 0,
                y: (height - cropHeight) / 2,
                width: cropWidth,
                height: cropHeight,
            })
        }
    }

    const getCroppedImg = async (): Promise<File> => {
        const image = imgRef.current
        const crop = completedCrop

        if (!image || !crop) {
            throw new Error("Crop data not available")
        }

        const canvas = document.createElement("canvas")
        const scaleX = image.naturalWidth / image.width
        const scaleY = image.naturalHeight / image.height

        // Set canvas to exact required dimensions
        canvas.width = requiredWidth
        canvas.height = requiredHeight

        const ctx = canvas.getContext("2d")
        if (!ctx) {
            throw new Error("No 2d context")
        }

        // Draw the cropped image scaled to exact dimensions
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            requiredWidth,
            requiredHeight
        )

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Canvas is empty"))
                        return
                    }
                    const file = new File([blob], imageFile.name, {
                        type: imageFile.type,
                        lastModified: Date.now(),
                    })
                    resolve(file)
                },
                imageFile.type,
                1
            )
        })
    }

    const handleCropComplete = async () => {
        if (!completedCrop) return

        setIsProcessing(true)
        try {
            const croppedFile = await getCroppedImg()
            onCropComplete(croppedFile)
            onClose()
        } catch (error) {
            console.error("Error cropping image:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle>Crop Image to Exact Size</DialogTitle>
                    <DialogDescription>
                        Adjust the crop area to select the part of the image you want to use.
                        The image will be resized to exactly {requiredWidth} x {requiredHeight} pixels.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-4">
                    {imageSrc && (
                        <div className="max-w-full overflow-auto">
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={aspectRatio}
                                locked={true}
                            >
                                <img
                                    ref={imgRef}
                                    src={imageSrc}
                                    alt="Crop preview"
                                    onLoad={onImageLoad}
                                    style={{ maxWidth: "100%", maxHeight: "60vh" }}
                                />
                            </ReactCrop>
                        </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                        <p>Required dimensions: {requiredWidth} x {requiredHeight} pixels</p>
                        <p>Aspect ratio: {aspectRatio.toFixed(2)}:1 (locked)</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleCropComplete} disabled={!completedCrop || isProcessing}>
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Crop & Use Image"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
