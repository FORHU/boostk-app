import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Password field with a show/hide toggle.
//
// Everything except `type` is forwarded to Input, so this drops into a TanStack
// Form field exactly where <Input type="password" /> used to sit — including
// aria-invalid, which the auth forms set from getFieldInvalid().
function PasswordInput({
  className,
  disabled,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        disabled={disabled}
        // pr-9 so revealed text never runs underneath the button.
        className={cn("pr-9", className)}
        type={visible ? "text" : "password"}
      />
      <button
        // MUST be "button": the default inside a <form> is submit, which would
        // sign the user up every time they peeked at their password.
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        // Kept in the tab order deliberately — a keyboard user needs to be able
        // to reveal what they typed. aria-pressed conveys the on/off state.
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className={cn(
          "absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center",
          "rounded-md text-muted-foreground transition-colors",
          "hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
