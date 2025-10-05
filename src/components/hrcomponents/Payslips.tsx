import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; // Adjust path as necessary
import { useToast } from "@/hooks/use-toast"; // Adjust path as necessary

interface Employee {
  first_name: string;
  last_name: string;
  employee_type: string;
}

interface Payroll {
  id: number;
  employee_id: number;
  salary: number;
  deduction: number;
  created_at: string;
  employee: Employee;  // Employee data joined
}

const formatPeso = (value: number) => `₱${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;

export default function Reports() {
  const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPayroll = async () => {
      setLoading(true);
      try {
        // Fetch payroll data with employee details
        const { data, error } = await supabase
          .from("payroll")
          .select(`
            id, 
            salary, 
            deduction, 
            created_at, 
            employee:employees(first_name, last_name, employee_type)  -- Joining employee data
          `);

        if (error) {
          toast({ title: "Error fetching payroll", description: error.message });
        } else {
          setPayrollRecords(data || []);
        }
      } catch (error) {
        toast({ title: "Error fetching payroll", description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [toast]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Payslips Reports</h2>
      <p className="mb-6">View payslips reports for all employees.</p>

      {loading && <p>Loading...</p>}

      <table className="min-w-full table-auto border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">Employee Name</th>
            <th className="border border-gray-300 px-4 py-2">Employee Type</th>
            <th className="border border-gray-300 px-4 py-2">Salary</th>
            <th className="border border-gray-300 px-4 py-2">Deductions</th>
            <th className="border border-gray-300 px-4 py-2">Date Created</th>
          </tr>
        </thead>
        <tbody>
          {payrollRecords.length === 0 && (
            <tr>
              <td colSpan={5} className="border border-gray-300 px-4 py-2 text-center">
                No payroll records found.
              </td>
            </tr>
          )}

          {payrollRecords.map((payroll) => (
            <tr key={payroll.id}>
              <td className="border border-gray-300 px-4 py-2">
                {payroll.employee.first_name} {payroll.employee.last_name}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">{payroll.employee.employee_type}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">{formatPeso(payroll.salary)}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">{formatPeso(payroll.deduction)}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                {new Date(payroll.created_at).toLocaleDateString()}  {/* Format date */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
