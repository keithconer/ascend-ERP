import { NavLink } from 'react-router-dom';
import { 
  Package, 
  HeadphonesIcon, 
  ShoppingCart, 
  Truck, 
  Calculator, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  FolderKanban, 
  UserCheck 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Inventory & Warehouse', href: '/inventory', icon: Package },
  { name: 'Customer Service', href: '/helpdesk', icon: HeadphonesIcon },
  { name: 'Procurement', href: '/procurement', icon: ShoppingCart },
  { name: 'Supply Chain', href: '/supply-chain', icon: Truck },
  { name: 'Finance & Accounting', href: '/finance', icon: Calculator },
  { name: 'E-Commerce', href: '/ecommerce', icon: ShoppingBag },
  { name: 'Reports & BI', href: '/reports', icon: BarChart3 },
  { name: 'Sales & CRM', href: '/sales', icon: Users },
  { name: 'Project Management', href: '/projects', icon: FolderKanban },
  { name: 'Human Resources', href: '/hr', icon: UserCheck },
];

export const Sidebar = () => {
  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary">ERP Ascend</h1>
      </div>
      
      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};