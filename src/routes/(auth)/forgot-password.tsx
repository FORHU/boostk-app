import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getFieldInvalid } from "@/lib/form-utils";
import { type ForgotPasswordInput, forgotPasswordSchema } from "@/modules/auth/auth.schema";

export const Route = createFileRoute("/(auth)/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { mutateAsync: requestResetMutation } = useMutation({
    mutationFn: async (value: ForgotPasswordInput) => {
      const { data, error } = await authClient.requestPasswordReset({
        email: value.email,
        redirectTo: "/reset-password",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setSent(true);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      setServerError(err?.message || "Something went wrong. Please try again.");
    },
  });

  const requestResetForm = useForm({
    defaultValues: {
      email: "",
    } as ForgotPasswordInput,
    validators: {
      onBlur: forgotPasswordSchema,
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      await requestResetMutation(value);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              {sent ? (
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Check your email</h1>
                    <p className="text-balance text-muted-foreground">
                      If an account exists for that address, we&apos;ve sent a link to reset your password.
                    </p>
                  </div>
                  {import.meta.env.DEV && (
                    <FieldDescription className="rounded-lg bg-muted p-3 text-center">
                      Dev mode: the reset link is logged to the server console.
                    </FieldDescription>
                  )}
                  <FieldDescription className="text-center">
                    <Link to="/signin">Back to login</Link>
                  </FieldDescription>
                </FieldGroup>
              ) : (
                <form
                  className="flex h-full flex-col justify-center"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await requestResetForm.handleSubmit();
                  }}
                >
                  <FieldGroup>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <h1 className="text-2xl font-bold">Forgot your password?</h1>
                      <p className="text-balance text-muted-foreground">
                        Enter your email and we&apos;ll send you a reset link.
                      </p>
                    </div>

                    {serverError && <p className="text-sm text-center text-destructive">{serverError}</p>}

                    <requestResetForm.Field name="email">
                      {(field) => {
                        const isInvalid = getFieldInvalid(field, requestResetForm);
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
                    </requestResetForm.Field>

                    <requestResetForm.Subscribe selector={(state) => state.isSubmitting}>
                      {(isSubmitting) => (
                        <Field>
                          <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Sending..." : "Send reset link"}
                          </Button>
                        </Field>
                      )}
                    </requestResetForm.Subscribe>

                    <FieldDescription className="text-center">
                      Remembered it? <Link to="/signin">Log in</Link>
                    </FieldDescription>
                  </FieldGroup>
                </form>
              )}
            </div>
            <div className="relative hidden bg-muted md:block">
              <img
                src="/sign-in.webp"
                alt="placeholder"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
