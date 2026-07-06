"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { toastError } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setAuth, updateUser, logout: clearAuth, hasRole, hasPermission } =
    useAuthStore();

  const login = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data);
      toast.success(`Welcome back, ${data.user?.name?.split(" ")[0] || "there"}!`);
      router.replace(searchParams.get("callbackUrl") || "/dashboard");
    },
    onError: (error) => toastError(error, "Invalid email or password"),
  });

  const register = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setAuth(data);
      toast.success("Account created! Please verify your email.");
      router.replace("/verify-email?sent=1");
    },
    onError: (error) => toastError(error, "Registration failed"),
  });

  const forgotPassword = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => toast.success("Reset link sent — check your inbox."),
    onError: (error) => toastError(error),
  });

  const resetPassword = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success("Password reset. Sign in with your new password.");
      router.replace("/login");
    },
    onError: (error) => toastError(error),
  });

  const changePassword = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => toast.success("Password changed successfully"),
    onError: (error) => toastError(error),
  });

  const updateProfile = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => {
      updateUser(data);
      toast.success("Profile updated");
    },
    onError: (error) => toastError(error),
  });

  const uploadAvatar = useMutation({
    mutationFn: authService.uploadAvatar,
    onSuccess: (data) => {
      if (data?.avatar) updateUser({ avatar: data.avatar });
      toast.success("Avatar updated");
    },
    onError: (error) => toastError(error, "Avatar upload failed"),
  });

  async function logout() {
    await authService.logout();
    clearAuth();
    queryClient.clear();
    router.replace("/login");
    toast.success("Signed out");
  }

  return {
    user,
    isAuthenticated,
    hasRole,
    hasPermission,
    login,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    uploadAvatar,
    logout,
  };
}
