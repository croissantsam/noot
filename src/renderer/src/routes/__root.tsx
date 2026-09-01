import { ThemeProvider } from "@/components/theme-provider";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
  <>
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <Outlet />
    </ThemeProvider>

    <TanStackRouterDevtools />
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
