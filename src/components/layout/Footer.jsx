import { APP_NAME } from "@/constants/app";

export default function Footer() {
  return (
    <footer className="border-t px-4 py-4 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
        <p>
          v1.0.0 · Built with Next.js 15 &amp; React 19
        </p>
      </div>
    </footer>
  );
}
