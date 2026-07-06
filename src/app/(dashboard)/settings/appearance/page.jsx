"use client";

import { useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useThemeStore } from "@/store/theme.store";
import { useSettingsStore } from "@/store/settings.store";
import { useSetting, useUpdateSetting } from "@/features/settings/hooks";
import { cn } from "@/utils/cn";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "de", label: "Deutsch (German)" },
  { value: "fr", label: "Français (French)" },
];
const DATE_FORMATS = [
  { value: "MMM d, yyyy", label: "Jan 5, 2026" },
  { value: "dd/MM/yyyy", label: "05/01/2026" },
  { value: "MM/dd/yyyy", label: "01/05/2026" },
  { value: "yyyy-MM-dd", label: "2026-01-05" },
];

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const { data } = useSetting("preferences");
  const setSettings = useSettingsStore((s) => s.setSettings);
  const update = useUpdateSetting("preferences");

  const [language, setLanguage] = useState(data?.language || "en");
  const [dateFormat, setDateFormat] = useState(data?.dateFormat || "MMM d, yyyy");

  const savePreferences = () => {
    update.mutate(
      { theme, language, dateFormat },
      {
        onSuccess: () => setSettings({ locale: language, dateFormat }),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
          <CardDescription>Choose how the interface looks. Changes apply instantly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {THEMES.map(({ value, label, icon: Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-sm font-medium transition-colors cursor-pointer",
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  {active && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <Icon className="h-6 w-6" />
                  {label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Language & format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Language & Format</CardTitle>
          <CardDescription>Set your preferred language and date format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={savePreferences} loading={update.isPending}>
              Save preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
