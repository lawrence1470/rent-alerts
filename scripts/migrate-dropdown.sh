#!/bin/bash

# Script to migrate DropdownMenu to Dropdown (shadcn → HeroUI)

echo "Migrating DropdownMenu to Dropdown..."

# Replace DropdownMenu imports
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -not -path "*/claudedocs/*" \
  -not -path "*/components/ui/dropdown-menu.tsx" \
  -exec grep -l 'from "@/components/ui/dropdown-menu"' {} \; | while read file; do

  echo "Processing DropdownMenu → Dropdown: $file"

  # Replace import statement
  sed -i '' 's|from "@/components/ui/dropdown-menu"|from "@heroui/react"|g' "$file"

  # Component name replacements
  sed -i '' 's|DropdownMenuContent|DropdownMenu|g' "$file"
  sed -i '' 's|DropdownMenuItem|DropdownItem|g' "$file"
  sed -i '' 's|DropdownMenuSeparator|DropdownSection|g' "$file"
  sed -i '' 's|DropdownMenuTrigger|DropdownTrigger|g' "$file"

  # Main component (last to avoid partial matches)
  sed -i '' 's|<DropdownMenu>|<Dropdown>|g' "$file"
  sed -i '' 's|</DropdownMenu>|</Dropdown>|g' "$file"

done

echo "DropdownMenu → Dropdown migration complete!"
echo "Note: HeroUI Dropdown structure is simplified. Check component usage."
