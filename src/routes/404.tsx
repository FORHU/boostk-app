import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/404')({
  component: RouteComponent,
})

function RouteComponent() {
  return 
   <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">404 — Page not found</h1>
    </div>
}

