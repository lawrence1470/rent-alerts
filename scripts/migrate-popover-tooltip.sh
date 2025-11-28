#!/bin/bash

# Script to migrate Popover and Tooltip (shadcn → HeroUI)
# Note: HeroUI has similar APIs but different prop names

echo "Migrating Popover and Tooltip..."

# Popover migration
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -not -path "*/claudedocs/*" \
  -not -path "*/components/ui/popover.tsx" \
  -exec grep -l 'from "@/components/ui/popover"' {} \; | while read file; do

  echo "Processing Popover: $file"

  # Replace import statement
  sed -i '' 's|from "@/components/ui/popover"|from "@heroui/react"|g' "$file"

  # HeroUI Popover uses simpler structure (Popover + PopoverTrigger + PopoverContent)
  # PopoverContent children become PopoverContent children (same)

done

# Tooltip migration
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -not -path "*/claudedocs/*" \
  -not -path "*/components/ui/tooltip.tsx" \
  -exec grep -l 'from "@/components/ui/tooltip"' {} \; | while read file; do

  echo "Processing Tooltip: $file"

  # Replace import statement
  sed -i '' 's|from "@/components/ui/tooltip"|from "@heroui/react"|g' "$file"

  # HeroUI Tooltip is simpler: <Tooltip content="text"><trigger></Tooltip>
  # TooltipProvider, TooltipTrigger, TooltipContent need manual refactoring

done

echo "Popover and Tooltip migration complete!"
echo "Note: Component structure may need manual adjustment for HeroUI API."
