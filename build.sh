#!/usr/bin/env bash
# بيان — يبني مجلد dist بملفات الموقع العامة فقط (بلا الدوال والقواعد والاختبارات وملفات المشروع)
# لـ Cloudflare Pages: Build command = bash build.sh ، Build output directory = dist
set -e
rm -rf dist && mkdir -p dist
cp index.html cp-7q4x9k.html 404.html _headers dist/
cp -r css js dist/
echo "dist جاهز: $(find dist -type f | wc -l) ملفات"
