import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  HandCoins,
  Receipt,
  BookOpen,
  Boxes,
  Truck,
  ShieldCheck,
  FileBarChart,
  Upload,
  Bell,
  Settings,
  HelpCircle,
  Flower2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const main = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Donor Management", url: "/dashboard/donors", icon: Users },
  { title: "Donations", url: "/dashboard/donations", icon: HandCoins },
  { title: "Income & Expenses", url: "/dashboard/expenses", icon: Receipt },
  { title: "Ledger & Accounting", url: "/dashboard/ledger", icon: BookOpen },
  { title: "Assets & Inventory", url: "/dashboard/assets", icon: Boxes },
  { title: "Cash & Vehicle", url: "/dashboard/cash", icon: Truck },
];

const ops = [
  { title: "Compliance Center", url: "/dashboard/compliance", icon: ShieldCheck },
  { title: "Reports", url: "/dashboard/reports", icon: FileBarChart },
  { title: "Document Upload (AI)", url: "/dashboard/upload", icon: Upload },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
];

const system = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Help & Support", url: "/dashboard/help", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(url);

  const renderGroup = (label: string, items: typeof main) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={item.title}
                className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-semibold"
              >
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2" aria-label="TrustSaathi">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Flower2 className="h-5 w-5" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold">TrustSaathi</p>
              <p className="truncate text-[11px] text-muted-foreground">Temple & Trust OS</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Main", main)}
        {renderGroup("Operations", ops)}
        {renderGroup("System", system)}
      </SidebarContent>
    </Sidebar>
  );
}
