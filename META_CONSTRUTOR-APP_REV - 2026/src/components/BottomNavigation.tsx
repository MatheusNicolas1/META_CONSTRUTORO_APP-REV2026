import { memo } from "react";
import { NavLink } from "react-router-dom";
import { Home, FileText, PlusCircle, Building2, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export const BottomNavigation = memo(() => {
  const { t } = useTranslation();

  const navItems = [
    {
      to: "/app/dashboard",
      icon: Home,
      label: t('menu.dashboard'),
    },
    {
      to: "/app/rdo",
      icon: FileText,
      label: t('menu.rdo'),
    },
    {
      to: "/app/rdo/novo",
      icon: PlusCircle,
      label: t('menu.novo_rdo'),
      isMain: true,
    },
    {
      to: "/app/obras",
      icon: Building2,
      label: t('menu.obras'),
    },
    {
      to: "/app/mais",
      icon: MoreHorizontal,
      label: t('menu.mais'),
    },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar-background/95 backdrop-blur-lg border-t border-sidebar-border lg:hidden safe-area-bottom"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2" style={{ height: '64px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center flex-1 h-full touch-safe transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground active:scale-95",
                  item.isMain && "relative"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.isMain ? (
                    <div className="flex flex-col items-center justify-center -mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-full p-3.5 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 active:scale-95">
                        <Icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <span className="text-[10px] font-semibold mt-1.5 text-foreground">{item.label}</span>
                    </div>
                  ) : (
                    <>
                      <Icon
                        className={cn(
                          "h-5 w-5 mb-1 transition-all duration-200",
                          isActive && "scale-110"
                        )}
                      />
                      <span className={cn(
                        "text-[10px] font-medium transition-all duration-200",
                        isActive && "font-semibold"
                      )}>{item.label}</span>
                    </>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
});

BottomNavigation.displayName = "BottomNavigation";
