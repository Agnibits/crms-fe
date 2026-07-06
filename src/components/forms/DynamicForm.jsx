"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormSwitch,
  FormDatePicker,
  FormNumber,
} from "./fields";
import { cn } from "@/utils/cn";

const FIELD_MAP = {
  text: FormInput,
  email: FormInput,
  password: FormInput,
  tel: FormInput,
  url: FormInput,
  number: FormNumber,
  textarea: FormTextarea,
  select: FormSelect,
  checkbox: FormCheckbox,
  switch: FormSwitch,
  date: FormDatePicker,
};

/**
 * Dynamic form builder — renders a form from a field config array.
 *
 * fields: [{ name, label, type, options?, placeholder?, required?, hint?, colSpan? }]
 * schema: zod schema; defaultValues: object; onSubmit(values)
 */
export default function DynamicForm({
  fields,
  schema,
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  cancelLabel,
  onCancel,
  loading = false,
  columns = 2,
  className,
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
  });

  const busy = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={className}>
      <div className={cn("grid gap-4", columns === 2 ? "sm:grid-cols-2" : "grid-cols-1")}>
        {fields.map((field) => {
          const Component = FIELD_MAP[field.type] || FormInput;
          const isInputLike = ["text", "email", "password", "tel", "url"].includes(field.type);
          return (
            <Component
              key={field.name}
              register={register}
              control={control}
              name={field.name}
              label={field.label}
              error={errors[field.name]}
              required={field.required}
              hint={field.hint}
              options={field.options}
              placeholder={field.placeholder}
              type={isInputLike ? field.type : undefined}
              className={cn(field.colSpan === 2 && "sm:col-span-2")}
            />
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-end gap-2">
        {cancelLabel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" loading={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
