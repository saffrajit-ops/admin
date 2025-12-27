"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProductFormFieldProps {
  label: string
  name: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  prefix?: string
  className?: string
}

export function ProductFormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  prefix,
  className = "",
}: ProductFormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`rounded-lg ${prefix ? "pl-8" : ""}`}
          step={type === "number" ? "0.01" : undefined}
          min={type === "number" ? "0" : undefined}
        />
      </div>
    </div>
  )
}
