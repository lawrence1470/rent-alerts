#!/bin/bash

# Script to migrate Select component from shadcn to HeroUI
# Note: HeroUI Select API is significantly different from shadcn
# This script only handles import migration - manual API conversion required

echo "Migrating Select imports..."

# Replace Select imports (shadcn uses multiple subcomponents)
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -not -path "*/claudedocs/*" \
  -not -path "*/components/ui/select.tsx" \
  -exec grep -l 'from "@/components/ui/select"' {} \; | while read file; do

  echo "Processing Select: $file"

  # Replace import statement
  # Note: HeroUI uses Select and SelectItem (no SelectTrigger, SelectContent, SelectValue)
  sed -i '' 's|from "@/components/ui/select"|from "@heroui/react"|g' "$file"

  # Remove unused imports (SelectTrigger, SelectContent, SelectValue)
  # These will be manually cleaned up as we don't need them in HeroUI

done

echo "Select import migration complete!"
echo "IMPORTANT: Select API is significantly different in HeroUI."
echo "Manual conversion required for:"
echo "  - Remove SelectTrigger, SelectContent, SelectValue usage"
echo "  - Update onValueChange to onSelectionChange"
echo "  - Update value prop to selectedKeys"
echo "  - Consolidate with label prop"
