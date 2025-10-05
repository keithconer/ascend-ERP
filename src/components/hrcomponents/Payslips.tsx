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
  status: string;  // Added status field
  created_at: string;
  employee: Employee;  // Employee data joined
}

const formatPeso = (value: number) => `₱${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;

export default function Reports() {
  const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Payroll[]>([]); // State for filtered payroll
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const { toast } = useToast();

  // Fetch payroll data
  useEffect(() => {
    const fetchPayroll = async () => {
      setLoading(true);
      try {
        // Correct query with employee relationship
        const { data, error } = await supabase
          .from("payroll")
          .select(`
            id, 
            salary, 
            deduction, 
            status, 
            created_at, 
            employee:employees(first_name, last_name, employee_type)  -- Corrected join
          `);

        if (error) {
          toast({ title: "Error fetching payroll", description: error.message });
        } else {
          setPayrollRecords(data || []);
          setFilteredRecords(data || []); // Set the filtered records initially to all records
        }
      } catch (error) {
        toast({ title: "Error fetching payroll", description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [toast]);

  // Update status of payroll in the database and on the UI
  const updateStatus = async (id: number) => {
    try {
      // Update the status to "Released" in the database
      const { error } = await supabase
        .from("payroll")
        .update({ status: "Released" })
        .eq("id", id);

      if (error) {
        toast({ title: "Error updating status", description: error.message });
      } else {
        toast({ title: "Status updated", description: "Payslip marked as released" });

        // Update the status locally after successful update
        setPayrollRecords((prevState) =>
          prevState.map((payroll) =>
            payroll.id === id ? { ...payroll, status: "Released" } : payroll
          )
        );

        // Filter the updated payroll status in the filtered records too
        setFilteredRecords((prevState) =>
          prevState.map((payroll) =>
            payroll.id === id ? { ...payroll, status: "Released" } : payroll
          )
        );
      }
    } catch (error) {
      toast({ title: "Error updating status", description: error.message });
    }
  };

  // Handle delete payroll record
  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this record?");
    if (confirmDelete) {
      try {
        // Delete the payroll record from the database
        const { error } = await supabase
          .from("payroll")
          .delete()
          .eq("id", id);

        if (error) {
          toast({ title: "Error deleting payroll", description: error.message });
        } else {
          toast({ title: "Payroll deleted", description: "The payroll record has been deleted." });

          // Remove the deleted record from the UI
          setPayrollRecords((prevState) =>
            prevState.filter((payroll) => payroll.id !== id)
          );
          setFilteredRecords((prevState) =>
            prevState.filter((payroll) => payroll.id !== id)
          );
        }
      } catch (error) {
        toast({ title: "Error deleting payroll", description: error.message });
      }
    }
  };

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    // Filter payroll records by employee name or employee type
    const filtered = payrollRecords.filter(
      (payroll) =>
        payroll.employee.first_name.toLowerCase().includes(term) ||
        payroll.employee.last_name.toLowerCase().includes(term) ||
        payroll.employee.employee_type.toLowerCase().includes(term)
    );
    setFilteredRecords(filtered); // Set filtered records
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Payslips Reports</h2>
      <p className="mb-6">View payslips reports for all employees.</p>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or employee type"
          className="border border-gray-300 p-2 w-full"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {loading && <p>Loading...</p>}

      <table className="min-w-full table-auto border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">Employee Name</th>
            <th className="border border-gray-300 px-4 py-2">Employee Type</th>
            <th className="border border-gray-300 px-4 py-2">Salary</th>
            <th className="border border-gray-300 px-4 py-2">Deductions</th>
            <th className="border border-gray-300 px-4 py-2">Status</th> {/* Added Status column */}
            <th className="border border-gray-300 px-4 py-2">Date Created</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th> {/* Added Actions column */}
          </tr>
        </thead>
        <tbody>
          {filteredRecords.length === 0 && (
            <tr>
              <td colSpan={7} className="border border-gray-300 px-4 py-2 text-center">
                No payroll records found.
              </td>
            </tr>
          )}

          {filteredRecords.map((payroll) => (
            <tr key={payroll.id}>
              <td className="border border-gray-300 px-4 py-2">
                {payroll.employee.first_name} {payroll.employee.last_name}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">{payroll.employee.employee_type}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">{formatPeso(payroll.salary)}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">{formatPeso(payroll.deduction)}</td>

              {/* Status Column */}
              <td className="border border-gray-300 px-4 py-2 text-center">
                {payroll.status === "Pending" ? (
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => updateStatus(payroll.id)}
                  >
                    Mark as Released
                  </button>
                ) : payroll.status === "Released" ? (
                  <span className="text-green-500">Released</span>
                ) : null}
              </td>

              <td className="border border-gray-300 px-4 py-2 text-center">
                {new Date(payroll.created_at).toLocaleDateString()}  {/* Format date */}
              </td>

              {/* Actions Column with Delete Button */}
              <td className="border border-gray-300 px-4 py-2 text-center">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={() => handleDelete(payroll.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
