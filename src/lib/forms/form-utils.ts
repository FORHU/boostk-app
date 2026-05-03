import type { AnyFieldApi, AnyFormApi } from "@tanstack/react-form";

export const getFieldInvalid = (field: AnyFieldApi, form: AnyFormApi) => {
  const hasErrors = field.state.meta.errors.length > 0;
  const shouldShowError = field.state.meta.isTouched || form.state.isSubmitted;

  return hasErrors && shouldShowError;
};
