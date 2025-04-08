import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Tenant {
  id: string;
  name: string;
  logo_url?: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  createTenant: (name: string, logoUrl?: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Carregar tenants do usuário atual
  useEffect(() => {
    const loadUserTenants = async () => {
      try {
        setIsLoading(true);
        
        // Verificar se há um usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setTenants([]);
          setCurrentTenant(null);
          return;
        }
        
        // Buscar os tenants associados ao usuário
        const { data, error } = await supabase
          .from('user_tenants')
          .select(`
            tenant_id,
            tenants (
              id,
              name,
              logo_url
            )
          `)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Formatar os dados
        const userTenants = data.map(item => item.tenants) as Tenant[];
        
        // Se o usuário não tiver nenhum tenant, criar um padrão
        if (userTenants.length === 0) {
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert({
              name: 'Minha Organização',
              created_by: user.id
            })
            .select()
            .single();
            
          if (tenantError) throw tenantError;
          
          const { error: userTenantError } = await supabase
            .from('user_tenants')
            .insert({
              user_id: user.id,
              tenant_id: tenantData.id,
              role: 'admin'
            });
            
          if (userTenantError) throw userTenantError;
          
          userTenants.push({
            id: tenantData.id,
            name: tenantData.name,
            logo_url: tenantData.logo_url
          });
        }
        
        setTenants(userTenants);
        
        // Se houver tenants, configurar o primeiro como atual
        // ou utilizar o último selecionado salvo no localStorage
        if (userTenants.length > 0) {
          const savedTenantId = localStorage.getItem('currentTenantId');
          
          const tenantToUse = savedTenantId 
            ? userTenants.find(t => t.id === savedTenantId) || userTenants[0]
            : userTenants[0];
            
          setCurrentTenant(tenantToUse);
          localStorage.setItem('currentTenantId', tenantToUse.id);
        }
      } catch (error) {
        console.error("Erro ao carregar tenants:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas organizações",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserTenants();
    
    // Monitorar mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadUserTenants();
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast]);
  
  // Função para alternar entre tenants
  const switchTenant = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentTenant(tenant);
    localStorage.setItem('currentTenantId', tenant.id);
    
    toast({
      title: "Organização alterada",
      description: `Você está agora em: ${tenant.name}`,
      variant: "success"
    });
  };
  
  // Função para criar novo tenant
  const createTenant = async (name: string, logoUrl?: string) => {
    try {
      setIsLoading(true);
      
      // Verificar se há um usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar uma organização",
          variant: "destructive"
        });
        return;
      }
      
      // Criar novo tenant
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name,
          logo_url: logoUrl,
          created_by: user.id
        })
        .select()
        .single();
        
      if (tenantError) throw tenantError;
      
      // Associar o usuário ao tenant criado
      const { error: userTenantError } = await supabase
        .from('user_tenants')
        .insert({
          user_id: user.id,
          tenant_id: newTenant.id,
          role: 'admin' // O criador é automaticamente admin
        });
        
      if (userTenantError) throw userTenantError;
      
      // Atualizar estado
      const createdTenant = {
        id: newTenant.id,
        name: newTenant.name,
        logo_url: newTenant.logo_url
      };
      
      setTenants(prev => [...prev, createdTenant]);
      setCurrentTenant(createdTenant);
      localStorage.setItem('currentTenantId', createdTenant.id);
      
      toast({
        title: "Organização criada",
        description: `A organização "${name}" foi criada com sucesso`,
        variant: "success"
      });
    } catch (error) {
      console.error("Erro ao criar tenant:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a organização",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <TenantContext.Provider 
      value={{ 
        currentTenant, 
        tenants, 
        isLoading, 
        switchTenant,
        createTenant
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

// Hook personalizado para facilitar o uso do contexto
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant deve ser usado dentro de um TenantProvider");
  }
  return context;
}; 