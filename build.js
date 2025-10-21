#!/usr/bin/env node

// Netlifyの環境変数からenv.jsファイルを生成するビルドスクリプト
const fs = require('fs');
const path = require('path');

const envContent = `// This file is auto-generated during build
window.ENV = {
    LIFF_ID: '${process.env.LIFF_ID || ''}',
    SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
    SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}'
};
`;

const outputPath = path.join(__dirname, 'public', 'js', 'env.js');

// env.jsファイルを作成
fs.writeFileSync(outputPath, envContent, 'utf8');

console.log('✓ env.js generated successfully');
console.log('Environment variables:');
console.log('- LIFF_ID:', process.env.LIFF_ID ? '✓ Set' : '✗ Not set');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Not set');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set');
