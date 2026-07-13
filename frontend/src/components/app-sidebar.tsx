import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
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
import { Badge } from "@/components/ui/badge";
import { useUploadDraft } from "@/hooks/use-upload-draft";

export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const hasUploadDraftPending = useUploadDraft();
  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(url);

  const main = [
    { title: t("sidebar.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("sidebar.donorManagement"), url: "/dashboard/donors", icon: Users },
    { title: t("sidebar.donations"), url: "/dashboard/donations", icon: HandCoins },
    { title: t("sidebar.incomeExpenses"), url: "/dashboard/expenses", icon: Receipt },
    { title: t("sidebar.ledger"), url: "/dashboard/ledger", icon: BookOpen },
    { title: t("sidebar.assets"), url: "/dashboard/assets", icon: Boxes },
    { title: t("sidebar.cash"), url: "/dashboard/cash", icon: Truck },
  ];

  const ops = [
    { title: t("sidebar.donorAudit"), url: "/dashboard/compliance", icon: ShieldCheck },
    { title: t("sidebar.reports"), url: "/dashboard/reports", icon: FileBarChart },
    { title: t("sidebar.documentUpload"), url: "/dashboard/upload", icon: Upload },
    { title: t("sidebar.notifications"), url: "/dashboard/notifications", icon: Bell },
  ];

  const system = [
    { title: t("sidebar.settings"), url: "/dashboard/settings", icon: Settings },
    { title: t("sidebar.help"), url: "/dashboard/help", icon: HelpCircle },
  ];

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
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate">{item.title}</span>
                    {item.url === "/dashboard/upload" && hasUploadDraftPending && !collapsed ? (
                      <Badge
                        variant="secondary"
                        className="ml-auto shrink-0 rounded-full px-1.5 py-0 text-[10px]"
                      >
                        {t("sidebar.draft")}
                      </Badge>
                    ) : null}
                  </span>
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
              <p className="truncate text-[11px] text-muted-foreground">
                {t("sidebar.brandSubtitle")}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup(t("sidebar.main"), main)}
        {renderGroup(t("sidebar.operations"), ops)}
        {renderGroup(t("sidebar.system"), system)}
      </SidebarContent>
    </Sidebar>
  );
}
