import "./globals.css";
import { AuthProvider } from "../lib/auth-context";

export const metadata = { title: "Pholo — Staff", description: "Clinic digitization platform, staff app" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}