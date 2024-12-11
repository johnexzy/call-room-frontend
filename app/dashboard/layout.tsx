import { NavigationBar } from "@/components/navigation-bar";
import { WebSocketProvider } from "@/contexts/websocket-context";
import { AuthProvider } from "@/contexts/auth-context";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <AuthProvider>
        <WebSocketProvider>
          <NavigationBar />
          <main>{children}</main>
        </WebSocketProvider>
      </AuthProvider>
    </div>
  );
}
