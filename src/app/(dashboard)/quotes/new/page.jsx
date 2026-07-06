"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import QuoteBuilder from "@/features/quotes/QuoteBuilder";
import { Button } from "@/components/ui/button";
import { quoteHooks } from "@/features/quotes/hooks";

export default function NewQuotePage() {
  const router = useRouter();
  const create = quoteHooks.useCreate({
    onSuccess: (quote) => router.push(quote?.id ? `/quotes/${quote.id}` : "/quotes"),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="New Quote"
        description="Pick a customer, add line items and send a polished quotation."
        actions={
          <Button variant="outline" onClick={() => router.push("/quotes")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />
      <QuoteBuilder
        onSubmit={(values) => create.mutate(values)}
        submitting={create.isPending}
        submitLabel="Create Quote"
      />
    </div>
  );
}
