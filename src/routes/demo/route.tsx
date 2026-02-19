import { createFileRoute, Outlet } from "@tanstack/react-router";
import Header from "@/components/Header";

export const Route = createFileRoute("/demo")({
  component: DemoRootLayout,
});

function DemoRootLayout() {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}
