#!/bin/bash

# Script to migrate Switch component from shadcn to HeroUI
# HeroUI Switch API is similar to Checkbox with isSelected/onValueChange

echo "Migrating Switch imports..."

# Replace Switch imports
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -not -path "*/claudedocs/*" \
  -not -path "*/components/ui/switch.tsx" \
  -exec grep -l 'from "@/components/ui/switch"' {} \; | while read file; do

  echo "Processing Switch: $file"

  # Replace import statement
  sed -i '' 's|from "@/components/ui/switch"|from "@heroui/react"|g' "$file"

  # Replace checked prop with isSelected
  sed -i '' 's|checked={|isSelected={|g' "$file"

  # Replace onCheckedChange with onValueChange
  sed -i '' 's|onCheckedChange={|onValueChange={|g' "$file"

  # Replace disabled with isDisabled
  sed -i '' 's|disabled={|isDisabled={|g' "$file"

done

echo "Switch migration complete!"
echo "Note: Labels may need manual adjustment to use Switch children prop."
