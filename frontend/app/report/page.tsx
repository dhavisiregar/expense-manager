"use client";

import { ReportClient } from "./ReportClient";

// Access is gated inside ReportClient — free users see current period only,
// old periods show a PRO badge and redirect to /upgrade on click.
export default function ReportPage() {
  return <ReportClient />;
}
