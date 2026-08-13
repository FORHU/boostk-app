import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { getFieldInvalid } from "@/lib/form-utils";
import { cn } from "@/lib/utils";
import { type ResetPasswordInput, resetPasswordSchema } from "@/modules/auth/auth.schema";

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({
    token: z.string().optional().catch(undefined),
    error: z.string().optional().catch(undefined),
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token, error } = Route.useSearch();
  const [reset, setReset] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { mutateAsync: resetPasswordMutation } = useMutation({
    mutationFn: async (value: ResetPasswordInput) => {
      if (!token) throw new Error("This reset link is missing its token. Please request a new one.");
      const { data, error } = await authClient.resetPassword({
        newPassword: value.newPassword,
        token,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setReset(true);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      setServerError(err?.message || "This reset link is invalid or has expired. Please request a new one.");
    },
  });

  const resetPasswordForm = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    } as ResetPasswordInput,
    validators: {
      onBlur: resetPasswordSchema,
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      await resetPasswordMutation(value);
    },
  });

  let body: ReactNode;
  if (reset) {
    body = (
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Password reset</h1>
          <p className="text-balance text-muted-foreground">
            Your password has been changed. You can now log in with your new password.
          </p>
        </div>
        <Field>
          <Button onClick={() => navigate({ to: "/signin" })} className="w-full">
            Log in
          </Button>
        </Field>
      </FieldGroup>
    );
  } else if (error) {
    body = (
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Link invalid or expired</h1>
          <p className="text-balance text-muted-foreground">
            This password reset link is no longer valid. Request a new one and try again.
          </p>
        </div>
        <Field>
          <Link to="/forgot-password" className={cn(buttonVariants(), "w-full")}>
            Request a new link
          </Link>
        </Field>
      </FieldGroup>
    );
  } else if (!token) {
    body = (
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-balance text-muted-foreground">
            This page needs a reset link. Open the link from the email we sent you to continue.
          </p>
        </div>
        <Field>
          <Link to="/forgot-password" className={cn(buttonVariants(), "w-full")}>
            Request a reset link
          </Link>
        </Field>
      </FieldGroup>
    );
  } else {
    body = (
      <form
        className="flex h-full flex-col justify-center"
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await resetPasswordForm.handleSubmit();
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Choose a new password</h1>
            <p className="text-balance text-muted-foreground">It must be at least 8 characters.</p>
          </div>

          {serverError && <p className="text-sm text-center text-destructive">{serverError}</p>}

          <resetPasswordForm.Field name="newPassword">
            {(field) => {
              const isInvalid = getFieldInvalid(field, resetPasswordForm);
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>New password</FieldLabel>
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
          </resetPasswordForm.Field>

          <resetPasswordForm.Field name="confirmPassword">
            {(field) => {
              const isInvalid = getFieldInvalid(field, resetPasswordForm);
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Confirm new password</FieldLabel>
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
          </resetPasswordForm.Field>

          <resetPasswordForm.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Field>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Resetting..." : "Reset password"}
                </Button>
              </Field>
            )}
          </resetPasswordForm.Subscribe>
        </FieldGroup>
      </form>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">{body}</div>
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
