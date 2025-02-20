import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // {
  //   "overrides": [
  //     {
  //       "files": ["tests/**/*"],
  //       "env": {
  //         "jest": true
  //       }
  //     }
  //   ]
  // }
);