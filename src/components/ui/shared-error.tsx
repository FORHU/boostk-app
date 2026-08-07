import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCcw } from "lucide-react";


export function SharedErrorComponent({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6 text-center bg-background">
      <div className="bg-destructive/10 p-4 rounded-full mb-4">
        <AlertTriangle className="text-destructive" size={32} />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        Something went wrong
      </h3>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        We ran into an issue while loading this page. 
      </p>
      {/* Client component: use Vite's build-time flag, not the server `env` module. */}
      {import.meta.env.DEV && (
        <div className="bg-muted p-3 rounded-[8px] border border-destructive/20 text-left w-full max-w-md overflow-auto mb-6">
          <code className="text-xs text-destructive whitespace-pre-wrap">
            {error.message}
          </code>
        </div>
      )}

      <button
        onClick={() => {
          router.invalidate();
        }}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-[10px] hover:bg-primary/90 active:scale-95 transition-all text-sm font-medium"
      >
        <RefreshCcw size={16} />
        Try Again
      </button>
    </div>
  );
}
