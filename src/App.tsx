import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import InventoryManagement from "./pages/inventory/InventoryManagement";
import ProjectManagement from "./pages/projects/ProjectManagement"; // Module 9 - Project Management
import CustomerService from './pages/customerService/CustomerService'; //Module 2 - Customer Service
import EmployeeRecordManagement from './pages/HR/EmployeeRecordManagement';//module 10 - HR Management
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/projects" element={<ProjectManagement />} />
          <Route path="/helpdesk" element={<CustomerService />} />
          <Route path="/hr" element={<EmployeeRecordManagement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
