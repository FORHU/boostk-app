import { Link, useRouterState } from "@tanstack/react-router";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { BreadcrumbValue } from "./breadcrumb-item";

function hasBreadcrumb(data: unknown): data is { breadcrumb: BreadcrumbValue } {
  return !!data && typeof data === "object" && "breadcrumb" in data;
}

export function TopbarBreadcrumb() {
  const matches = useRouterState({
    select: (s) => s.matches,
  });

  const breadcrumbs = matches.flatMap((match) =>
    hasBreadcrumb(match.loaderData) ? [match.loaderData.breadcrumb] : [],
  );

  if (breadcrumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <Fragment key={`${crumb.title}`}>
              <BreadcrumbItem>{renderBreadcrumb(crumb)}</BreadcrumbItem>

              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// TODO: Add other breadcrumb types here
// TODO: Create components for each type of breadcrumb in src\components\layout\breadcrumb-item.tsx

const renderBreadcrumb = (crumb: BreadcrumbValue) => {
  switch (crumb.type) {
    case "link":
      return <BreadcrumbLink render={<Link to={crumb.path} />}>{crumb.title}</BreadcrumbLink>;
    default:
      return <BreadcrumbPage>{crumb.title}</BreadcrumbPage>;
  }
};
