import { ThemeProvider } from "@/components/theme-provider";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";

const RootLayout = () => (
  <>
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <Outlet />
      <Toaster richColors position="top-right" />
    </ThemeProvider>

    {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
  </>
);

export const Route = createRootRoute({
  head: () => ({
    meta: [
      // your meta tags and site config
    ],
    // other head config
  }),
  component: RootLayout,
});
