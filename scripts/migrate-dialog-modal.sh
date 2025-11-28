#!/bin/bash

# Script to migrate Dialog to Modal (shadcn → HeroUI)
# Note: API differences require manual adjustment after import replacement

echo "Migrating Dialog to Modal imports..."

# Replace Dialog imports
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -not -path "*/claudedocs/*" \
  -not -path "*/components/ui/dialog.tsx" \
  -exec grep -l 'from "@/components/ui/dialog"' {} \; | while read file; do

  echo "Processing Dialog → Modal: $file"

  # Replace import statement
  sed -i '' 's|from "@/components/ui/dialog"|from "@heroui/react"|g' "$file"

  # Component name replacements
  sed -i '' 's|DialogContent|ModalContent|g' "$file"
  sed -i '' 's|DialogHeader|ModalHeader|g' "$file"
  sed -i '' 's|DialogTitle|ModalTitle|g' "$file"
  sed -i '' 's|DialogDescription|ModalBody|g' "$file"
  sed -i '' 's|DialogFooter|ModalFooter|g' "$file"

  # Dialog → Modal (this should be last to avoid replacing the subcomponents above)
  sed -i '' 's|<Dialog |<Modal |g' "$file"
  sed -i '' 's|</Dialog>|</Modal>|g' "$file"

done

echo "Dialog → Modal migration complete!"
echo "IMPORTANT: Manual adjustments required:"
echo "  - Replace 'open={state}' with 'isOpen={state}'"
echo "  - Replace 'onOpenChange={fn}' with 'onOpenChange={fn}' (same)"
echo "  - Add ModalBody wrapper if not using DialogDescription"
echo "  - Adjust component structure for HeroUI Modal API"
