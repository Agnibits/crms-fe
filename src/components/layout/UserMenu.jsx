"use client";

import Link from "next/link";
import { KeyRound, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/common/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/constants/roles";

export default function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2 cursor-pointer"
          aria-label="Open user menu"
        >
          <UserAvatar name={user?.name} src={user?.avatar} className="h-8 w-8" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
          {user?.role && (
            <p className="mt-1 text-[11px] font-medium text-primary">
              {ROLE_LABELS[user.role] || user.role}
            </p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/change-password">
            <KeyRound /> Change password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => logout()}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
