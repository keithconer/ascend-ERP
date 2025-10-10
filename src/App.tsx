// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import InventoryManagement from "./pages/inventory/InventoryManagement";
import ProcurementPage from "./pages/Procurement/ProcurementPage";
import HumanResourcePage from "./pages/humanresources/HumanResourcePage";  
import FinanceManagementPage from "./pages/finance/FinanceManagement";
import NotFound from "./pages/NotFound";
import SalesPage from "./pages/sales/SalesPage";
import CustomerServicePage from "./pages/customerservice/CustomerServicePage";
import { ERPLayout } from "@/components/erp/ERPLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/inventory"
            element={
              <ERPLayout>
                <InventoryManagement />
              </ERPLayout>
            }
          />
          <Route
            path="/procurement"
            element={
              <ERPLayout>
                <ProcurementPage />
              </ERPLayout>
            }
          />
          <Route
            path="/hr"  // The /hr route should render HumanResourcePage
            element={
              <ERPLayout>
                <HumanResourcePage />  {/* Render the HumanResourcePage here */}
              </ERPLayout>
            }
          />
          <Route
            path="/finance"  // The /finance route should render FinanceManagementPage
            element={
              <ERPLayout>
                <FinanceManagementPage />  {/* Render the FinanceManagementPage here */}
              </ERPLayout>
            }
          />
          <Route
            path="/sales"  // The /sales route should render SalesPage
            element={
              <ERPLayout>
                <SalesPage />  
              </ERPLayout>
            }
          />
            <Route
            path="/helpdesk" 
            element={
              <ERPLayout>
                <CustomerServicePage />  
              </ERPLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
