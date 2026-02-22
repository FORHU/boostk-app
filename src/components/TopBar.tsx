import { Link } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

interface TopBarProps {
  breadcrumbs: BreadcrumbItem[];
}

export function TopBar({ breadcrumbs }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-6">
      <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-gray-500">
        <Link to="/" className="hover:text-gray-900 transition-colors">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </Link>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <div key={crumb.label} className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              {crumb.to ? (
                <Link
                  to={crumb.to as any}
                  params={crumb.params}
                  className={`hover:text-gray-900 transition-colors ${isLast ? "text-gray-900 font-semibold" : ""}`}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? "text-gray-900 font-semibold" : ""}>{crumb.label}</span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <button className="text-gray-500 hover:text-gray-900 transition-colors">
          <Search size={20} />
        </button>
        <button className="text-gray-500 hover:text-gray-900 transition-colors relative">
          <Bell size={20} />
          {/* Unread indicator */}
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
