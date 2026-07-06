"use client";

import { useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import UserAvatar from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FormInput } from "@/components/forms/fields";
import { profileSchema } from "@/validations/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/constants/roles";
import { formatDate } from "@/utils/format";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export default function ProfilePage() {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      department: user?.department || "",
    },
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Image must be under 2 MB");
      return;
    }
    uploadAvatar.mutate(file);
    e.target.value = "";
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal information and preferences."
        actions={
          <Button asChild variant="outline">
            <Link href="/profile/change-password">
              <KeyRound className="h-4 w-4" /> Change password
            </Link>
          </Button>
        }
      />

      {/* Avatar card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
          <div className="relative">
            <UserAvatar name={user?.name} src={user?.avatar} className="h-20 w-20 text-xl" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 cursor-pointer"
              aria-label="Upload avatar"
              disabled={uploadAvatar.isPending}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {ROLE_LABELS[user?.role] || user?.role || "User"}
              </span>
              {user?.createdAt && <span>Member since {formatDate(user.createdAt)}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit profile</CardTitle>
          <CardDescription>Update your name and contact details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) => updateProfile.mutate(values))}
            noValidate
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput register={register} name="name" label="Full name" error={errors.name} required />
              <FormInput
                register={register}
                name="email"
                type="email"
                label="Email"
                error={errors.email}
                required
                disabled
                hint="Contact an administrator to change your email."
              />
              <FormInput register={register} name="phone" type="tel" label="Phone" error={errors.phone} />
              <FormInput register={register} name="department" label="Department" error={errors.department} />
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button type="submit" loading={updateProfile.isPending} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
