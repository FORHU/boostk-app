import type { AnyFieldApi, AnyFormApi } from "@tanstack/react-form";

export const getFieldInvalid = (field: AnyFieldApi, form: AnyFormApi) => {
  return field.state.meta.errors.length > 0 && field.state.meta.isTouched && !form.state.isValid;
};
