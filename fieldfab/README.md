
<div align="center">
  <img src="./src/assets/fieldfab-logo-main.png" alt="FieldFab Logo" width="180" />
  <h1>FieldFab</h1>
  <p><strong>FieldFab</strong> is a React + TypeScript application for pipe specification and fabrication workflows.</p>
</div>

---

## Project Overview

FieldFab streamlines the process of specifying, sketching, and managing pipe fabrication tasks. Built with Vite, React, and TypeScript, it features a modern UI and customizable forms for field and shop use.

## Features

- Pipe specification form
- Welded outlet form
- Pipe sketching tool
- Responsive, modern UI
- Built with Vite, React, TypeScript, and Tailwind CSS

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run the development server:**
   ```sh
   npm run dev
   ```
3. **Build for production:**
   ```sh
   npm run build
   ```

## Project Structure

- `src/components/` – React components (forms, sketch tool)
- `src/assets/` – Images and logos
- `src/data/` – Pipe options and data

## License

MIT

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
