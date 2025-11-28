#!/bin/bash

# Script to migrate Input and Label components from shadcn to HeroUI
# Note: HeroUI Input has built-in label support, but we'll keep them separate initially
# for simpler migration, then consolidate in manual pass

echo "Migrating Input and Label imports..."

# Replace Input imports
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -not -path "*/claudedocs/*" \
  -exec grep -l 'from "@/components/ui/input"' {} \; | while read file; do

  echo "Processing Input: $file"

  # Replace import statement
  sed -i '' 's|from "@/components/ui/input"|from "@heroui/react"|g' "$file"

done

echo "Input migration complete!"

echo "Note: Label components are kept as-is for now."
echo "HeroUI Input has built-in label prop, but we'll consolidate in manual review."
