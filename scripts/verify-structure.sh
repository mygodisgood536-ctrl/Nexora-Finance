#!/bin/bash
echo "Nexora structure verification"
echo "=============================="
echo "Source files:"
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l
echo ""
echo "Key APIs:"
find src/app/api -name "route.ts" | sort
echo ""
echo "Prisma models:"
grep -c "^model " prisma/schema.prisma
echo "Done."
