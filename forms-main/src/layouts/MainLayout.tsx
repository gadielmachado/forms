import { TenantSelector } from "@/components/tenant/TenantSelector";

// ... resto do código existente

return (
  <div className="flex h-screen">
    {/* Sidebar */}
    <div className="sidebar">
      {/* ... menus ... */}
    </div>
    
    {/* Conteúdo principal */}
    <div className="flex-1 flex flex-col">
      <header className="h-16 border-b flex items-center justify-between px-6">
        <h1 className="text-xl font-bold">Soren Forms</h1>
        
        {/* Adicionar o seletor de tenant */}
        <TenantSelector />
      </header>
      
      <main className="flex-1 overflow-auto p-6">
        {/* Conteúdo da página */}
      </main>
    </div>
  </div>
); 