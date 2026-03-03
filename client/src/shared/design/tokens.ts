export const DESIGN_TOKEN = {
  color: {
    brandPrimary: '#54BEC1',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  layout: {
    minWidth: 1250,
    headerHeight: 51,
    sidebarWidth: 270,
  },
} as const;

export type DesignToken = typeof DESIGN_TOKEN;
