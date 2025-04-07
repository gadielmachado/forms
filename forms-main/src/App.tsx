import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import CreateForm from "./pages/CreateForm";
import SavedForms from "./pages/SavedForms";
import ViewForm from "./pages/ViewForm";
import Dashboard from "./pages/Dashboard";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import FormResponses from "@/pages/FormResponses";
import { TenantProvider } from "@/contexts/TenantContext";
import Customization from "./pages/Customization";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/form/:id" element={<ViewForm />} />
                  
                  <Route
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/" element={<CreateForm />} />
                    <Route path="/forms" element={<SavedForms />} />
                    <Route path="/forms/:id/responses" element={<FormResponses />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/customization" element={<Customization />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;