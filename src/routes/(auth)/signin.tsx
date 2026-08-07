import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { getFieldInvalid } from "@/lib/form-utils";
import { type SignInInput, signInSchema } from "@/modules/auth/auth.schema";

export const Route = createFileRoute("/(auth)/signin")({
  component: SigninPage,
});

function SigninPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  // Force Light Mode on mount and restore original theme on unmount
  useLayoutEffect(() => {
    const html = document.documentElement;

    // Cache original theme states to restore later
    const hasDark = html.classList.contains("dark");
    const hasLight = html.classList.contains("light");
    const originalTheme = html.getAttribute("data-theme");
    const originalColorScheme = html.style.colorScheme;

    // Apply forced light mode
    html.classList.remove("dark");
    html.classList.add("light");
    html.setAttribute("data-theme", "light");
    html.style.colorScheme = "light";

    // Cleanup function runs when navigating away (e.g., successful login)
    return () => {
      html.classList.remove("light", "dark");
      if (hasDark) html.classList.add("dark");
      if (hasLight) html.classList.add("light");

      if (originalTheme !== null) {
        html.setAttribute("data-theme", originalTheme);
      } else {
        html.removeAttribute("data-theme");
      }

      html.style.colorScheme = originalColorScheme;
    };
  }, []);

  const { mutateAsync: signInMutation } = useMutation({
    mutationFn: async (value: SignInInput) => {
      const { data, error } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      navigate({ to: "/dashboard/organizations" });
    },
    onError: (error: any) => {
      setServerError(error?.message || "Failed to sign in. Please try again.");
    },
  });

  const signInForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as SignInInput,
    validators: {
      onBlur: signInSchema,
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      await signInMutation(value);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form
              className="p-6 md:p-8"
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await signInForm.handleSubmit();
              }}
            >
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Welcome back</h1>
                  <p className="text-balance text-muted-foreground">Login to your Boostk account</p>
                </div>

                {serverError && <p className="text-sm text-center text-destructive">{serverError}</p>}

                <signInForm.Field name="email">
                  {(field) => {
                    const isInvalid = getFieldInvalid(field, signInForm);
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="m@example.com"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </signInForm.Field>

                <signInForm.Field name="password">
                  {(field) => {
                    const isInvalid = getFieldInvalid(field, signInForm);
                    return (
                      <Field data-invalid={isInvalid}>
                        <div className="flex items-center">
                          <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                          <Link to="/" className="ml-auto text-sm underline-offset-2 hover:underline">
                            Forgot your password?
                          </Link>
                        </div>
                        <PasswordInput
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </signInForm.Field>

                <signInForm.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Field>
                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Signing in..." : "Login"}
                      </Button>
                    </Field>
                  )}
                </signInForm.Subscribe>

                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link to="/signup">Sign up</Link>
                </FieldDescription>
              </FieldGroup>
            </form>
            <div className="relative hidden bg-muted md:block">
              <img
                src="/sign-in.webp"
                alt="placeholder"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
        <FieldDescription className="py-6 text-center text-xs">
          By clicking continue, you agree to our <Link to="/">Terms of Service</Link> and{" "}
          <Link to="/">Privacy Policy</Link>.
        </FieldDescription>
      </div>
    </div>
  );
}
