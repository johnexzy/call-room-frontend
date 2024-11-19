import { CallHistory } from "@/components/calls/call-history";

export default function CallsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Call History</h1>
      <CallHistory />
    </div>
  );
} 