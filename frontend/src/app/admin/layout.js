import { AdminAuthProvider } from "@/contexts/AdminAuthContext";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
