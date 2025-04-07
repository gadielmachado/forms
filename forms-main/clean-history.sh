
git filter-branch --force --index-filter "
git rm --cached --ignore-unmatch replacements.txt.txt
git rm --cached --ignore-unmatch src/server/services/openaiService.ts
git rm --cached --ignore-unmatch src/types/env.d.ts
git rm --cached --ignore-unmatch src/pages/SavedForms.tsx
" --prune-empty --tag-name-filter cat -- --all

