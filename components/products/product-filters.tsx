"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface ProductFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  featured: string
  onFeaturedChange: (value: string) => void
  onClear: () => void
}

export function ProductFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  featured,
  onFeaturedChange,
  onClear,
}: ProductFiltersProps) {
  const hasFilters = search || status !== "all" || featured !== "all"

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products by title, SKU, or brand..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-lg"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[150px] rounded-lg cursor-pointer">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
          <SelectItem value="active" className="cursor-pointer">Active</SelectItem>
          <SelectItem value="inactive" className="cursor-pointer">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Select value={featured} onValueChange={onFeaturedChange}>
        <SelectTrigger className="w-full sm:w-[150px] rounded-lg cursor-pointer">
          <SelectValue placeholder="Featured" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="cursor-pointer">All Products</SelectItem>
          <SelectItem value="true" className="cursor-pointer">Featured</SelectItem>
          <SelectItem value="false" className="cursor-pointer">Not Featured</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={onClear}
          className="rounded-lg gap-2 cursor-pointer"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
