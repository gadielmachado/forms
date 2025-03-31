import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  LogOut,
  Plug,
  Palette,
} from "lucide-react";

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar = ({ onLogout }: SidebarProps) => {
  const location = useLocation();

  const navigation = [
    {
      name: "Criar Forms",
      href: "/",
      icon: PlusCircle,
    },
    {
      name: "Formulários",
      href: "/forms",
      icon: FileSpreadsheet,
    },
    {
      name: "Dashboards",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Personalização",
      href: "/customization",
      icon: Palette,
    },
    {
      name: "Integrações",
      href: "/integrations",
      icon: Plug,
    },
    {
      name: "Configurações",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-indigo-600 to-indigo-800 text-white">
      <div className="flex h-16 items-center px-6 border-b border-indigo-500/30">
        <img 
          src="/images/logo_s.svg" 
          alt="Soren Forms Logo" 
          className="h-8"
        />
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors relative group",
                isActive
                  ? "bg-indigo-500/20 text-white"
                  : "text-indigo-100 hover:bg-indigo-500/10 hover:text-white"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-md mr-3 transition-colors",
                isActive ? "bg-indigo-500 text-white" : "text-indigo-200 group-hover:bg-indigo-500/20"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span>{item.name}</span>
              {isActive && (
                <span className="absolute left-0 w-1 h-4/5 bg-white rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-indigo-500/30 p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-indigo-100 rounded-lg transition-colors hover:bg-indigo-500/10"
        >
          <div className="p-1.5 rounded-md mr-3 text-indigo-200">
            <LogOut className="h-5 w-5" />
          </div>
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;