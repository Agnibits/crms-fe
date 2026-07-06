"use client";

import { motion } from "framer-motion";
import { Zap, BarChart3, Users, ShieldCheck } from "lucide-react";
import { APP_NAME } from "@/constants/app";

const highlights = [
  { icon: Users, text: "Manage customers, leads and deals in one place" },
  { icon: BarChart3, text: "Realtime pipeline analytics and forecasting" },
  { icon: ShieldCheck, text: "Enterprise-grade security with role-based access" },
];

/** Split-screen auth shell: brand panel + form card. */
export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">{APP_NAME}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-md"
        >
          <h1 className="text-3xl font-semibold leading-tight">
            Close more deals with a CRM your team will actually love.
          </h1>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-sidebar-foreground/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative text-xs text-sidebar-foreground/60">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
