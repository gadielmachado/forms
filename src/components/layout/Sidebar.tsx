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
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onLogout: () => void;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

const Sidebar = ({ onLogout, isMobileMenuOpen, onMobileMenuToggle }: SidebarProps) => {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  
  // Este efeito garante que a animação só aconteça após o componente ser montado
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Determinar classes para a versão mobile da sidebar
  const mobileSidebarClasses = cn(
    "lg:hidden flex h-full w-72 flex-col bg-gradient-to-b from-indigo-600 to-indigo-800 text-white",
    "fixed inset-y-0 left-0 z-50 shadow-xl transition-transform duration-300 ease-in-out",
    {
      "translate-x-0": isMobileMenuOpen && mounted,
      "-translate-x-full": !isMobileMenuOpen && mounted
    }
  );

  // Overlay para quando o menu está aberto no mobile
  const overlayClasses = cn(
    "lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 backdrop-blur-sm",
    {
      "opacity-100 pointer-events-auto": isMobileMenuOpen && mounted,
      "opacity-0 pointer-events-none": !isMobileMenuOpen || !mounted
    }
  );

  // Conteúdo interno da sidebar (usado em ambas versões)
  const renderSidebarContent = () => (
    <>
      <div className="flex h-16 items-center justify-between px-6 border-b border-indigo-500/30">
        <img 
          src="/images/logo_s.svg" 
          alt="Soren Forms Logo" 
          className="h-8"
        />
        {/* Botão de fechar só aparece na versão mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white lg:hidden"
          onClick={onMobileMenuToggle}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
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
              onClick={() => {
                // Em dispositivos móveis, fechar o menu ao navegar
                if (window.innerWidth < 1024 && onMobileMenuToggle) {
                  onMobileMenuToggle();
                }
              }}
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

        {/* Versão e informações - visível apenas no mobile */}
        <div className="mt-4 pt-4 border-t border-indigo-500/30 text-xs text-indigo-200/70 lg:hidden">
          <p className="text-center">Soren Forms v1.0</p>
          <p className="text-center mt-1">© 2024 Soren</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Overlay para fechar ao clicar fora (apenas mobile) */}
      <div className={overlayClasses} onClick={onMobileMenuToggle} />
      
      {/* Versão mobile da sidebar (escondida em desktop) */}
      <div className={mobileSidebarClasses}>
        {renderSidebarContent()}
      </div>
      
      {/* Versão desktop da sidebar (original, sem alterações) */}
      <div className="hidden lg:flex h-full w-64 flex-col bg-gradient-to-b from-indigo-600 to-indigo-800 text-white">
        {renderSidebarContent()}
      </div>
    </>
  );
};

export default Sidebar;