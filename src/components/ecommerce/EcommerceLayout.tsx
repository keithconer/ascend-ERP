import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

interface EcommerceLayoutProps {
  children: React.ReactNode;
}

const sidebarNavItems = [
  {
    title: "Order Sync",
    href: "/ecommerce",
    icon: "ListIcon",
  },
  {
    title: "Products",
    href: "/ecommerce/products",
    icon: "PackageIcon",
  },
  {
    title: "Settings",
    href: "/ecommerce/settings",
    icon: "Settings",
  },
];

export function EcommerceLayout({ children }: EcommerceLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <div className="relative overflow-hidden py-6 pr-6 lg:py-8">
            <h2 className="px-4 text-lg font-semibold tracking-tight">E-commerce</h2>
            <nav className="relative space-y-1 py-4">
              {sidebarNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    location.pathname === item.href
                      ? "bg-muted hover:bg-muted"
                      : "hover:bg-transparent hover:underline",
                    "w-full justify-start"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
