export type BreadcrumbType = "link" | "page" | "procurement-plan-selector" | "procurement-plan-year-selector";

export interface BreadcrumbValue {
  title: string;
  path: string;
  type: BreadcrumbType;
}

// TODO: Add component for rendering types of breadcrumb item here
// TODO: Add types in src\components\layout\topbar-breadcrumb.tsx
