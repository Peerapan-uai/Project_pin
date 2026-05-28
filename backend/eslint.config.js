const js = require('@eslint/js');
const globals = require('globals');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // 1. Preset rules จาก ESLint official
  js.configs.recommended,

  // 2. Config ของโปรเจคนาย
  {
    languageOptions: {
      ecmaVersion: 2024,           // รองรับ syntax ใหม่สุด
      sourceType: 'commonjs',      // backend ใช้ require/module.exports
      globals: {
        ...globals.node,           // process, console, Buffer, __dirname, ฯลฯ
      },
    },
    rules: {
      'no-unused-vars': 'warn',                              // ตัวแปรไม่ใช้ → warn
      'no-console': ['warn', { allow: ['warn', 'error'] }],  // ห้าม console.log แต่ .warn/.error ok
      'eqeqeq': 'error',                                     // ต้องใช้ === ห้ามใช้ ==
      'no-var': 'error',                                     // ห้าม var (ใช้ let/const)
      'prefer-const': 'warn',                                // ตัวที่ไม่ reassign ให้ใช้ const
    },
  },

  // 3. ปิด ESLint rules ที่ทับ Prettier (ต้องอยู่ "สุดท้าย"!)
  prettierConfig,

  // 4. Ignore ไฟล์/folders ที่ไม่ต้อง lint
  {
    ignores: [
      'node_modules/',
      'uploads/',
      'logs/',
      'coverage/',
      '**/*.sql',
    ],
  },
];