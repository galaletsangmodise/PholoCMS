import "./globals.css"; 

export const metadata = { title: "Pholo — Staff", description: "Clinic digitization platform, staff app" }; // browser tab title/description

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}