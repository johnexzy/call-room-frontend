import { NavigationBar } from "@/components/navigation-bar";
import { WebSocketProvider } from "@/contexts/websocket-context";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <WebSocketProvider>
        <NavigationBar />
        <main>{children}</main>
      </WebSocketProvider>
    </div>
  );
}
