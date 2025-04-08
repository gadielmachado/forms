import { useTenant } from "@/contexts/TenantContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Building, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TenantSelector() {
  const { currentTenant, tenants, switchTenant, createTenant, isLoading } = useTenant();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) return;
    
    setIsCreating(true);
    await createTenant(newTenantName);
    setIsCreating(false);
    setNewTenantName("");
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {tenants.length > 0 ? (
        <>
          <Select 
            value={currentTenant?.id} 
            onValueChange={switchTenant}
            disabled={tenants.length <= 1}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione a organização">
                <div className="flex items-center">
                  {currentTenant?.logo_url ? (
                    <img
                      src={currentTenant.logo_url}
                      alt={currentTenant.name}
                      className="h-5 w-5 rounded-full mr-2"
                    />
                  ) : (
                    <Building className="h-4 w-4 mr-2" />
                  )}
                  {currentTenant?.name || "Selecione"}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  <div className="flex items-center">
                    {tenant.logo_url ? (
                      <img
                        src={tenant.logo_url}
                        alt={tenant.name}
                        className="h-5 w-5 rounded-full mr-2"
                      />
                    ) : (
                      <Building className="h-4 w-4 mr-2" />
                    )}
                    {tenant.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : (
        <span className="text-sm text-gray-500">Nenhuma organização</span>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            <span>Nova</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Organização</DialogTitle>
            <DialogDescription>
              Crie uma nova organização para gerenciar seus formulários separadamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Organização</Label>
              <Input
                id="name"
                placeholder="Minha Empresa Ltda."
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTenant} 
              disabled={!newTenantName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Organização"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 