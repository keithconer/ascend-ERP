import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ERPLayout } from '@/components/erp/ERPLayout';

// Import components for HR tabs
import EmployeeManagement from '@/components/hrcomponents/EmployeeManagement';
import Payroll from '@/components/hrcomponents/Payroll';
import Attendance from '@/components/hrcomponents/Attendance';
import DepartmentManagement from '@/components/hrcomponents/DepartmentManagement';

export default function HumanResourcePage() {
  return (
    <ERPLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Human Resources</h1>
          <p className="text-muted-foreground">Manage employees, payroll, and attendance</p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="department-management" className="space-y-4">
          <TabsList>
            <TabsTrigger value="department-management">Department Management</TabsTrigger>
            <TabsTrigger value="employee-management">Employee Management</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="department-management">
            <DepartmentManagement />
          </TabsContent>

          <TabsContent value="employee-management">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="payroll">
            <Payroll />
          </TabsContent>

          <TabsContent value="attendance">
            <Attendance />
          </TabsContent>
        </Tabs>
      </div>
    </ERPLayout>
  );
}
