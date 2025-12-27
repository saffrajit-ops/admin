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

interface TaxonomyOption {
  _id: string
  name: string
  slug: string
  subcategories?: TaxonomyOption[]
}

interface BlogFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  categories: TaxonomyOption[]
  onClear: () => void
}

export function BlogFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  categories,
  onClear,
}: BlogFiltersProps) {
  const hasFilters = search || status !== "all" || category !== "all"

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, excerpt, or tags..."
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
          <SelectItem value="published" className="cursor-pointer">Published</SelectItem>
          <SelectItem value="draft" className="cursor-pointer">Draft</SelectItem>
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[180px] rounded-lg cursor-pointer">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="cursor-pointer">All Categories</SelectItem>
          {categories.map((cat) => (
            <div key={cat._id}>
              <SelectItem value={cat._id} className="cursor-pointer font-semibold">
                {cat.name}
              </SelectItem>
              {cat.subcategories && cat.subcategories.map((sub) => (
                <SelectItem key={sub._id} value={sub._id} className="cursor-pointer pl-6">
                  └─ {sub.name}
                </SelectItem>
              ))}
            </div>
          ))}
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
