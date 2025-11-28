#!/bin/bash

# Script to migrate Sheet to Modal (shadcn → HeroUI)
# HeroUI doesn't have Sheet, use Modal with placement prop

echo "Migrating Sheet to Modal..."

# Replace Sheet imports
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -not -path "*/claudedocs/*" \
  -not -path "*/components/ui/sheet.tsx" \
  -exec grep -l 'from "@/components/ui/sheet"' {} \; | while read file; do

  echo "Processing Sheet → Modal: $file"

  # Replace import statement
  sed -i '' 's|from "@/components/ui/sheet"|from "@heroui/react"|g' "$file"

  # Component name replacements
  sed -i '' 's|SheetContent|ModalContent|g' "$file"
  sed -i '' 's|SheetHeader|ModalHeader|g' "$file"
  sed -i '' 's|SheetTitle|ModalTitle|g' "$file"
  sed -i '' 's|SheetDescription|ModalBody|g' "$file"
  sed -i '' 's|SheetFooter|ModalFooter|g' "$file"
  sed -i '' 's|SheetTrigger|ModalTrigger|g' "$file"

  # Sheet → Modal (last to avoid partial matches)
  sed -i '' 's|<Sheet |<Modal |g' "$file"
  sed -i '' 's|</Sheet>|</Modal>|g' "$file"

done

echo "Sheet → Modal migration complete!"
echo "IMPORTANT: Add placement='right' (or 'left', 'top', 'bottom') prop to Modal for side sheet behavior."
