#!/bin/bash

# Script to migrate Button props from shadcn to HeroUI patterns
# Usage: ./scripts/migrate-button-props.sh

echo "Migrating Button onClick to onPress..."

# Find all .tsx files and replace onClick with onPress
find . -type f -name "*.tsx" \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/onClick=/onPress=/g' {} \;

echo "Migrating Button variant names..."

# variant="outline" -> variant="bordered"
find . -type f -name "*.tsx" \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/variant="outline"/variant="bordered"/g' {} \;

# variant="ghost" -> variant="light"
find . -type f -name "*.tsx" \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/variant="ghost"/variant="light"/g' {} \;

# variant="destructive" -> color="danger"
find . -type f -name "*.tsx" \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/variant="destructive"/color="danger"/g' {} \;

# variant="secondary" -> color="secondary"
find . -type f -name "*.tsx" \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/variant="secondary"/color="secondary"/g' {} \;

echo "Migrating Button size props..."

# size="icon" -> isIconOnly
find . -type f -name "*.tsx" \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/size="icon"/isIconOnly/g' {} \;

# size="icon-sm" -> isIconOnly size="sm"
find . -type f -name "*.tsx" \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/size="icon-sm"/isIconOnly size="sm"/g' {} \;

# size="icon-lg" -> isIconOnly size="lg"
find . -type f -name "*.tsx" \
  -not -path "*/node_modules/*" \
  -not -path "*/scripts/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/size="icon-lg"/isIconOnly size="lg"/g' {} \;

echo "Button prop migration complete!"
