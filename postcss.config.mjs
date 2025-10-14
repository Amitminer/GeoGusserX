/**
 * The PostCSS configuration for the project.
 * It enables the Tailwind CSS plugin, which processes the Tailwind directives
 * in the CSS files and generates the final CSS.
 */
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;