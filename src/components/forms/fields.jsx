"use client";

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils/cn";

/** Label + control + error message wrapper shared by all form fields. */
export function FieldWrapper({ label, name, error, required, hint, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

export function FormInput({ register, name, label, error, required, hint, className, ...props }) {
  return (
    <FieldWrapper {...{ label, name, error, required, hint, className }}>
      <Input id={name} aria-invalid={!!error} {...register(name)} {...props} />
    </FieldWrapper>
  );
}

export function FormTextarea({ register, name, label, error, required, hint, className, ...props }) {
  return (
    <FieldWrapper {...{ label, name, error, required, hint, className }}>
      <Textarea id={name} aria-invalid={!!error} {...register(name)} {...props} />
    </FieldWrapper>
  );
}

/** options: [{ value, label }] */
/** Flat by default; renders grouped `<SelectGroup>`s when options carry a `group`. */
function renderSelectOptions(options) {
  const item = (option) => (
    <SelectItem key={option.value} value={String(option.value)}>
      {option.label}
    </SelectItem>
  );
  if (!options.some((o) => o.group)) return options.map(item);

  const groups = [];
  const byName = new Map();
  for (const option of options) {
    const name = option.group || "Other";
    if (!byName.has(name)) {
      byName.set(name, []);
      groups.push(name);
    }
    byName.get(name).push(option);
  }
  return groups.map((name) => (
    <SelectGroup key={name}>
      <SelectLabel>{name}</SelectLabel>
      {byName.get(name).map(item)}
    </SelectGroup>
  ));
}

export function FormSelect({
  control,
  name,
  label,
  error,
  required,
  hint,
  options = [],
  placeholder = "Select…",
  className,
  disabled,
}) {
  return (
    <FieldWrapper {...{ label, name, error, required, hint, className }}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value ? String(field.value) : undefined}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger id={name} aria-invalid={!!error}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>{renderSelectOptions(options)}</SelectContent>
          </Select>
        )}
      />
    </FieldWrapper>
  );
}

export function FormCheckbox({ control, name, label, error, hint, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <Checkbox checked={!!field.value} onCheckedChange={field.onChange} id={name} />
            {label}
          </label>
        )}
      />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error.message}</p>}
    </div>
  );
}

export function FormSwitch({ control, name, label, error, hint, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-lg border p-3", className)}>
      <div>
        <Label htmlFor={name}>{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        {error && <p className="text-xs font-medium text-destructive">{error.message}</p>}
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch id={name} checked={!!field.value} onCheckedChange={field.onChange} />
        )}
      />
    </div>
  );
}

export function FormDatePicker({ register, name, label, error, required, hint, className, ...props }) {
  return (
    <FieldWrapper {...{ label, name, error, required, hint, className }}>
      <Input id={name} type="date" aria-invalid={!!error} {...register(name)} {...props} />
    </FieldWrapper>
  );
}

export function FormNumber({ register, name, label, error, required, hint, className, ...props }) {
  return (
    <FieldWrapper {...{ label, name, error, required, hint, className }}>
      <Input
        id={name}
        type="number"
        step="any"
        aria-invalid={!!error}
        {...register(name, { valueAsNumber: true })}
        {...props}
      />
    </FieldWrapper>
  );
}
