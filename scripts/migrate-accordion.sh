#!/bin/bash

# Script to migrate Accordion (shadcn → HeroUI)

echo "Migrating Accordion..."

# Replace Accordion imports
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -not -path "*/claudedocs/*" \
  -not -path "*/components/ui/accordion.tsx" \
  -exec grep -l 'from "@/components/ui/accordion"' {} \; | while read file; do

  echo "Processing Accordion: $file"

  # Replace import statement
  sed -i '' 's|from "@/components/ui/accordion"|from "@heroui/react"|g' "$file"

  # HeroUI Accordion uses similar structure but different prop names
  # AccordionItem, AccordionTrigger, AccordionContent remain mostly the same

done

echo "Accordion migration complete!"
echo "Note: Check component structure for HeroUI Accordion API differences."
