/**
 * Unified Alert Creation/Editing Page
 *
 * Routes:
 * - /dashboard/alerts/new → Create mode
 * - /dashboard/alerts/[uuid] → Edit mode
 */

import * as React from "react";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { DashboardLayout } from "@/components/dashboard";
import { AlertForm } from "@/components/alerts";
import { alertToFormValues } from "@/lib/validations/alert";

interface AlertPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getAlert(id: string, userId: string) {
  try {
    // Import db and schema for server-side query
    const { db } = await import("@/lib/db");
    const { alerts } = await import("@/lib/schema");
    const { eq, and } = await import("drizzle-orm");

    const alert = await db.query.alerts.findFirst({
      where: and(
        eq(alerts.id, id),
        eq(alerts.userId, userId)
      ),
    });

    return alert;
  } catch (error) {
    console.error("Error fetching alert:", error);
    return null;
  }
}

export default async function AlertPage({ params }: AlertPageProps) {
  const { userId } = await auth();
  const resolvedParams = await params;

  if (!userId) {
    notFound();
  }

  const isCreateMode = resolvedParams.id === "new";

  // Fetch existing alert if in edit mode
  let alert = null;
  if (!isCreateMode) {
    alert = await getAlert(resolvedParams.id, userId);

    // If alert not found or doesn't belong to user, show 404
    if (!alert) {
      notFound();
    }
  }

  const pageTitle = isCreateMode ? "Create Alert" : "Edit Alert";
  const pageDescription = isCreateMode
    ? "Set up a new rental alert to get notified about listings that match your criteria"
    : "Update your alert settings and notification preferences";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground mt-2">{pageDescription}</p>
        </div>

        {/* Alert Form */}
        <AlertForm
          mode={isCreateMode ? "create" : "edit"}
          alertId={isCreateMode ? undefined : resolvedParams.id}
          initialValues={alert ? alertToFormValues(alert) : undefined}
        />
      </div>
    </DashboardLayout>
  );
}

export async function generateMetadata({ params }: AlertPageProps) {
  const resolvedParams = await params;
  const isCreateMode = resolvedParams.id === "new";

  return {
    title: isCreateMode ? "Create Alert" : "Edit Alert",
    description: isCreateMode
      ? "Create a new rental alert"
      : "Edit your rental alert",
  };
}
