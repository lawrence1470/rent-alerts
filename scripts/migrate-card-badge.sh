#!/bin/bash

# Script to migrate Card and Badge components from shadcn to HeroUI
# Usage: ./scripts/migrate-card-badge.sh

echo "Migrating Card imports..."

# Replace Card imports
find . -type f -name "*.tsx" \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -exec grep -l '@/components/ui/card' {} \; | while read file; do

  echo "Processing Card: $file"

  # Replace import statement
  sed -i '' 's|from "@/components/ui/card"|from "@heroui/react"|g' "$file"

  # Replace CardContent with CardBody
  sed -i '' 's|CardContent|CardBody|g' "$file"
  sed -i '' 's|<CardContent>|<CardBody>|g' "$file"
  sed -i '' 's|</CardContent>|</CardBody>|g' "$file"

done

echo "Migrating Badge to Chip..."

# Replace Badge imports
find . -type f -name "*.tsx" \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -not -path "*/components/ui/rent-stabilized-badge.tsx" \
  -exec grep -l '@/components/ui/badge' {} \; | while read file; do

  echo "Processing Badge: $file"

  # Replace import statement - Badge becomes Chip in HeroUI
  sed -i '' 's|from "@/components/ui/badge"|from "@heroui/react"|g' "$file"

  # Replace Badge with Chip
  sed -i '' 's|<Badge |<Chip |g' "$file"
  sed -i '' 's|</Badge>|</Chip>|g' "$file"
  sed -i '' 's|Badge{|Chip{|g' "$file"

done

echo "Card and Badge migration complete!"
