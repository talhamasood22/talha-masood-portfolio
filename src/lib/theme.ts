export type Theme = "light" | "dark";

/**
 * Browser chrome colour (the `theme-color` meta) for each theme. These match
 * the `--page` token of the two palettes in globals.css.
 */
export const THEME_CHROME: Record<Theme, string> = {
  dark: "#0a1015",
  light: "#f4f7fa",
};
