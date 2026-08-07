import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { getFieldInvalid } from "@/lib/form-utils";
// Assuming you have SignUpInput and signUpSchema defined alongside signIn equivalents
import { type SignUpInput, signUpSchema } from "@/modules/auth/auth.schema";

export const Route = createFileRoute("/(auth)/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { mutateAsync: signUpMutation } = useMutation({
    mutationFn: async (value: SignUpInput) => {
      const { data, error } = await authClient.signUp.email({
        name: value.name,
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
    onError: (error: unknown) => {
      setServerError(error instanceof Error ? error.message : "Failed to sign up. Please try again.");
    },
  });

  const signUpForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    } as SignUpInput,
    validators: {
      onBlur: signUpSchema,
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      await signUpMutation(value);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form
              className="p-6 md:p-8"
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await signUpForm.handleSubmit();
              }}
            >
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Create an account</h1>
                  <p className="text-balance text-muted-foreground">Sign up to get started with Boostk</p>
                </div>

                {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

                <signUpForm.Field name="name">
                  {(field) => {
                    const isInvalid = getFieldInvalid(field, signUpForm);
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="John Doe"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </signUpForm.Field>

                <signUpForm.Field name="email">
                  {(field) => {
                    const isInvalid = getFieldInvalid(field, signUpForm);
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
                </signUpForm.Field>

                <signUpForm.Field name="password">
                  {(field) => {
                    const isInvalid = getFieldInvalid(field, signUpForm);
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
                </signUpForm.Field>

                <signUpForm.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Field>
                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Signing up..." : "Sign up"}
                      </Button>
                    </Field>
                  )}
                </signUpForm.Subscribe>

                <FieldDescription className="text-center">
                  Already have an account? <Link to="/signin">Log in</Link>
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
