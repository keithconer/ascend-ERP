import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_type: string;
  rate_per_day: number;
  work_days_per_week: number;
}

interface PayrollEntry extends Employee {
  total_days_worked: number;
  salary: number;
  deductions: {
    sss: number;
    philhealth: number;
    total: number;
  };
}

const formatPeso = (value: number) => `₱${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;

export default function Payroll() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Constants for deductions
  const SSS_DEDUCTION = 250;
  const PHILHEALTH_DEDUCTION = 250;

  // Fetch employees from DB
  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_type, rate_per_day, work_days_per_week");

      if (error) {
        toast({ title: "Error fetching employees", description: error.message });
        setEmployees([]);
      } else {
        setEmployees(data || []);
        // Initialize payrollData with zero days worked & calculated salary
        const initialPayroll = (data || []).map((emp) => ({
          ...emp,
          total_days_worked: 0,
          salary: 0,
          deductions: {
            sss: 0,
            philhealth: 0,
            total: 0,
          },
        }));
        setPayrollData(initialPayroll);
      }
      setLoading(false);
    }

    fetchEmployees();
  }, [toast]);

  // Handle days worked change
  const handleDaysWorkedChange = (id: number, days: number) => {
    if (days < 0) days = 0;
    if (days > 30) days = 30; // Max 30 days as per your requirement

    setPayrollData((prev) =>
      prev.map((entry) => {
        let deductions = {
          sss: 0,
          philhealth: 0,
          total: 0,
        };
        let salary = entry.rate_per_day * days;

        if (days >= 1 && days <= 15) {
          // Deduction applies for 1-15 days worked
          deductions.sss = SSS_DEDUCTION;
          deductions.philhealth = PHILHEALTH_DEDUCTION;
          deductions.total = deductions.sss + deductions.philhealth;

          salary = salary - deductions.total; // Apply deduction to salary
        }

        return entry.id === id
          ? {
              ...entry,
              total_days_worked: days,
              salary,
              deductions,
            }
          : entry;
      })
    );
  };

  // Placeholder for managing payroll - save to DB
  const handleManagePayroll = async () => {
    setLoading(true);

    try {
      const payrollRecords = payrollData
        .filter((p) => p.total_days_worked > 0)
        .map((p) => ({
          employee_id: p.id,
          payroll_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          payroll_period_end: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(),
          days_worked: p.total_days_worked,
          salary: p.salary,
          deduction: p.deductions.total,
          created_at: new Date().toISOString(),
        }));

      if (payrollRecords.length === 0) {
        toast({ title: "No payroll data", description: "Please enter days worked for employees." });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("payroll").insert(payrollRecords);

      if (error) throw error;

      toast({ title: "Payroll saved", description: "Payroll data saved successfully." });
    } catch (error: any) {
      toast({ title: "Error saving payroll", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle search term change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter payrollData based on search term
  const filteredPayrollData = payrollData.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      emp.employee_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Payroll</h2>
      <p className="mb-6">Manage and view employee payroll details with a detailed breakdown.</p>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or employee type"
          className="border border-gray-300 p-2 w-full"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {loading && <p>Loading...</p>}

      <table className="min-w-full table-auto border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">Employee Name</th>
            <th className="border border-gray-300 px-4 py-2">Employee Type</th>
            <th className="border border-gray-300 px-4 py-2">Rate Per Day</th>
            <th className="border border-gray-300 px-4 py-2">Work Days/Week</th>
            <th className="border border-gray-300 px-4 py-2">Total Days Worked (1-30)</th>
            <th className="border border-gray-300 px-4 py-2">Deductions</th>
            <th className="border border-gray-300 px-4 py-2">Breakdown</th>
            <th className="border border-gray-300 px-4 py-2">Salary</th>
          </tr>
        </thead>
        <tbody>
          {filteredPayrollData.length === 0 && (
            <tr>
              <td colSpan={8} className="border border-gray-300 px-4 py-2 text-center">
                No employees found.
              </td>
            </tr>
          )}
          {filteredPayrollData.map((emp) => (
            <tr key={emp.id}>
              <td className="border border-gray-300 px-4 py-2">
                {emp.first_name} {emp.last_name}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">{emp.employee_type}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">{formatPeso(emp.rate_per_day)}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">{emp.work_days_per_week}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={emp.total_days_worked}
                  onChange={(e) => handleDaysWorkedChange(emp.id, Number(e.target.value))}
                  className="w-20 border rounded px-2 py-1 text-center"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                {emp.deductions.total > 0 ? formatPeso(emp.deductions.total) : "₱0.00"}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <ul>
                  <li><strong>SSS:</strong> {formatPeso(emp.deductions.sss)} </li>
                  <li><strong>PhilHealth:</strong> {formatPeso(emp.deductions.philhealth)} </li>
                </ul>
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                {formatPeso(emp.salary)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
        onClick={handleManagePayroll}
        disabled={loading}
      >
        {loading ? "Saving..." : "Send to Finance"}
      </button>
    </div>
  );
}
