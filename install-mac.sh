#!/bin/bash
# התקנה בלחיצה אחת — Photonics Workshop Site (Mac/Linux)
set -e

echo "=== Photonics Workshop Site - Setup ==="

# 1) Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js לא מותקן. מתקין דרך Homebrew..."
  if ! command -v brew >/dev/null 2>&1; then
    echo "מתקין Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  brew install node
fi

# 2) תלויות
echo "מתקין תלויות..."
npm install

# 3) הרצה
echo ""
echo "✔ ההתקנה הושלמה! האתר יעלה עכשיו בכתובת http://localhost:8080"
npm run dev
