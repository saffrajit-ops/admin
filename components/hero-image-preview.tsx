"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { ImageIcon, X } from "lucide-react"

interface HeroImagePreviewProps {
  imageUrl?: string
  alt?: string
  isActive?: boolean
  onRemove?: () => void
  className?: string
}

export function HeroImagePreview({ 
  imageUrl, 
  alt = "Hero image", 
  isActive = true, 
  onRemove,
  className = "" 
}: HeroImagePreviewProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Exact Frontend Hero Card Replica */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ 
          scale: isActive ? 1.45 : 1,
        }}
        transition={{ type: "spring", stiffness: 40, damping: 15 }}
        className="relative w-[110px] md:w-[150px] aspect-[4/5] rounded-[35px] overflow-hidden shadow-xl border-[3px] border-white bg-white"
        style={{ transformOrigin: "center center" }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 110px, 150px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ImageIcon className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
          </div>
        )}
        
        {/* Remove Button */}
        {onRemove && imageUrl && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
            type="button"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.div>
      
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <div className="w-2 h-2 bg-[#ff5c6f] rounded-full"></div>
        </div>
      )}
    </div>
  )
}

// Hero Section Preview Container (matches frontend layout)
interface HeroSectionPreviewProps {
  slides: Array<{
    id?: string
    _id?: string
    title: string
    subtitle: string
    description: string
    image?: { url: string }
    buttonText: string
    buttonLink: string
  }>
  currentSlide?: number
  onSlideChange?: (index: number) => void
  onRemoveSlide?: (index: number) => void
}

export function HeroSectionPreview({ 
  slides, 
  currentSlide = 0, 
  onSlideChange,
  onRemoveSlide 
}: HeroSectionPreviewProps) {
  // Replicate frontend circular positioning logic
  const getSlideStyle = (index: number) => {
    const total = slides.length
    if (total === 0) return { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 10 }

    let offset = index - currentSlide
    if (offset > total / 2) offset -= total
    else if (offset < -total / 2) offset += total

    const RADIUS = 200 // Scaled down for admin preview
    const ANGLE_SPREAD = 22
    const baseAngle = -90
    const slideAngle = (offset * ANGLE_SPREAD) + baseAngle
    const rad = (slideAngle * Math.PI) / 180

    const x = Math.cos(rad) * RADIUS
    const y = Math.sin(rad) * RADIUS
    const centerX = 0
    const centerY = RADIUS + 20

    const finalX = centerX + x
    const finalY = centerY + y

    const isActive = offset === 0
    const dist = Math.abs(offset * ANGLE_SPREAD)
    const isVisible = dist < 100
    const opacity = isVisible ? 1 : 0
    const scale = isActive ? 1.45 : Math.max(0.5, 1 - (dist / 100))
    const zIndex = isActive ? 50 : 50 - Math.round(dist)

    return {
      x: finalX,
      y: finalY,
      rotate: slideAngle + 90,
      scale,
      opacity,
      zIndex,
      display: opacity === 0 ? 'none' : 'block'
    }
  }

  return (
    <div className="relative w-full h-[300px] bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Preview Label */}
      <div className="absolute top-3 left-3 z-20">
        <span className="text-xs font-medium text-gray-500 bg-white/80 px-2 py-1 rounded-full">
          Preview
        </span>
      </div>

      {/* Circular Layout Preview */}
      <div className="absolute top-[50px] left-1/2 -translate-x-1/2 w-0 h-0 z-10">
        {slides.map((slide, index) => {
          const style = getSlideStyle(index)
          return (
            <motion.div
              key={slide._id || slide.id || index}
              initial={false}
              animate={{
                x: style.x,
                y: style.y,
                rotate: style.rotate,
                scale: style.scale,
                opacity: style.opacity,
                zIndex: style.zIndex,
              }}
              transition={{ type: "spring", stiffness: 40, damping: 15 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ transformOrigin: "center center" }}
              onClick={() => onSlideChange?.(index)}
            >
              <HeroImagePreview
                imageUrl={slide.image?.url}
                alt={slide.title}
                isActive={index === currentSlide}
                onRemove={onRemoveSlide ? () => onRemoveSlide(index) : undefined}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Content Preview */}
      {slides[currentSlide] && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-[#ff5c6f] font-semibold mb-1">
              {slides[currentSlide].subtitle}
            </div>
            <div className="text-sm font-bold text-gray-800 mb-1 line-clamp-1">
              {slides[currentSlide].title}
            </div>
            <div className="text-xs text-gray-600 line-clamp-2">
              {slides[currentSlide].description}
            </div>
          </div>
        </div>
      )}

      {/* Slide Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => onSlideChange?.(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-[#ff5c6f] w-4' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Single Image Upload Preview (for form fields)
interface ImageUploadPreviewProps {
  imageUrl?: string
  alt?: string
  onRemove?: () => void
  onClick?: () => void
  isUploading?: boolean
}

export function ImageUploadPreview({ 
  imageUrl, 
  alt = "Upload preview", 
  onRemove, 
  onClick,
  isUploading = false 
}: ImageUploadPreviewProps) {
  return (
    <div className="relative inline-block">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-[110px] md:w-[150px] aspect-[4/5] rounded-[35px] overflow-hidden shadow-xl border-[3px] border-white bg-white cursor-pointer group"
        onClick={onClick}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 110px, 150px"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
            <ImageIcon className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500 text-center px-2">
              {isUploading ? 'Uploading...' : 'Click to upload'}
            </span>
          </div>
        )}
        
        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Remove Button */}
        {onRemove && imageUrl && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10 opacity-0 group-hover:opacity-100"
            type="button"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.div>
      
      {/* Upload Instructions */}
      {!imageUrl && !isUploading && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
          <div className="text-xs text-gray-500 whitespace-nowrap">
            4:5 ratio • Max 5MB
          </div>
        </div>
      )}
    </div>
  )
}

export default HeroImagePreview