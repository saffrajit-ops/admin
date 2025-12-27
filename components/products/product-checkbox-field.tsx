"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ProductCheckboxFieldProps {
  label: string
  name: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
}

export function ProductCheckboxField({
  label,
  name,
  checked,
  onChange,
  description,
}: ProductCheckboxFieldProps) {
  return (
    <div className="flex items-start space-x-3 space-y-0">
      <Checkbox
        id={name}
        checked={checked}
        onCheckedChange={onChange}
        className="mt-1"
      />
      <div className="space-y-1 leading-none">
        <Label
          htmlFor={name}
          className="text-sm font-medium cursor-pointer"
        >
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}
