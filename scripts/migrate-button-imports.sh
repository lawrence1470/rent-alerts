#!/bin/bash

# Script to migrate Button imports from shadcn to HeroUI
# Usage: ./scripts/migrate-button-imports.sh

echo "Migrating Button imports from shadcn/ui to HeroUI..."

# Find all .tsx and .ts files (excluding node_modules and scripts)
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -exec grep -l '@/components/ui/button' {} \; | while read file; do

  echo "Processing: $file"

  # Replace import statement
  sed -i '' 's|import { Button } from "@/components/ui/button"|import { Button } from "@heroui/react"|g' "$file"
  sed -i '' 's|import { Button, ButtonProps } from "@/components/ui/button"|import { Button, ButtonProps } from "@heroui/react"|g' "$file"

done

echo "Button import migration complete!"
