import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "./Sidebar";
import { useToast } from "@/components/ui/use-toast";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const MainLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={toggleMobileMenu}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 flex items-center h-16 px-4 border-b bg-white shadow-sm lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            className="mr-2 hover:bg-gray-100"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex justify-center flex-1">
            <img 
              src="/images/logo_s.svg" 
              alt="Soren Forms Logo" 
              className="h-8"
            />
          </div>
          <div className="w-10"></div>
        </div>
        <div className="container py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;