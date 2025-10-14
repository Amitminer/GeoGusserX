import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * In ES modules, `__dirname` is not available by default. This is a workaround to get the
 * directory name of the current module.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * The `FlatCompat` utility is used to create a compatibility layer that allows
 * legacy ESLint configurations (like those from `eslint-config-next`) to be used
 * with the new flat config format.
 */
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * The main ESLint configuration for the project, using the new flat config format.
 * It extends the recommended Next.js configurations and specifies files to be ignored.
 */
const eslintConfig = [
  // Extends the recommended ESLint configurations from Next.js for core web vitals and TypeScript.
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Specifies a list of files and directories that ESLint should ignore.
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;