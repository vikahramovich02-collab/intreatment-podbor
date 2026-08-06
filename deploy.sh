#!/usr/bin/env bash
# Выкладка прототипа на GitHub Pages:
#   bash deploy.sh
# Собирает dist и заливает его в ветку gh-pages репозитория intreatment-podbor.
set -e
cd "$(dirname "$0")"
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"

echo "📦 Сборка..."
npm run build --silent | tail -3

TMP=$(mktemp -d)
cp -R dist/* "$TMP/"
touch "$TMP/.nojekyll"

cd "$TMP"
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.email="ahramovich71@gmail.com" -c user.name="vikahramovich02-collab" \
  commit -q -m "deploy $(date '+%d.%m.%Y %H:%M')"
git remote add origin https://github.com/vikahramovich02-collab/intreatment-podbor.git
git push -q -f origin gh-pages
cd - > /dev/null
rm -rf "$TMP"

echo "✓ Готово: https://vikahramovich02-collab.github.io/intreatment-podbor/"
echo "  (Pages пересобирается 1–2 минуты)"
