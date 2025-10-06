"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import AddEmployeeModal from "./AddEmployeeModal"
import EditEmployeeModal from "./EditEmployeeModal"

type Employee = {
  id: string
  created_at: string | null
  first_name: string
  last_name: string
  middle_initial?: string | null
  department_id: string
  position: string
  updated_at: string | null
  phone_number?: string | null
  hire_date?: string | null
  employee_type?: string | null
  rate_per_day?: number | null
  work_days_per_week?: number | null
}

type Department = {
  id: string
  name: string
  created_at: string | null
  updated_at: string | null
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Fetch employees and departments on mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: employeeData, error: employeeError } = await supabase.from<Employee>("employees").select("*")
      if (employeeError) {
        console.error("Error fetching employees:", employeeError)
      } else {
        setEmployees(employeeData || [])
      }

      const { data: departmentData, error: departmentError } = await supabase.from<Department>("departments").select("*")
      if (departmentError) {
        console.error("Error fetching departments:", departmentError)
      } else {
        setDepartments(departmentData || [])
      }
    }
    fetchData()
  }, [])

  // Add employee callback (adds to state)
  const handleSaveEmployee = (newEmployee: Employee) => {
    setEmployees((prev) => [...prev, newEmployee])
    setIsAddModalOpen(false)
  }

  // Edit employee callback (updates in state)
  const handleEditEmployee = (updatedEmployee: Employee) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
    )
    setIsEditModalOpen(false)
    setEmployeeToEdit(null)
  }

  // Delete employee and cascade delete attendance records
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return

    setDeleteError(null)

    try {
      // 1. Delete attendance records for this employee
      const { error: attendanceError } = await supabase
        .from("attendance")
        .delete()
        .eq("employee_id", employeeToDelete.id)
      if (attendanceError) throw attendanceError

      // 2. Delete the employee record itself
      const { error: employeeError } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeToDelete.id)
      if (employeeError) throw employeeError

      // Update local state
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeToDelete.id))
      setShowDeleteConfirmation(false)
      setEmployeeToDelete(null)
      setDeleteError(null)
    } catch (error: any) {
      setDeleteError(`Failed to delete employee: ${error.message || "Unknown error occurred"}`)
    }
  }

  // Filter employees by search query (name or department)
  const filteredEmployees = employees.filter((employee) => {
    const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase()
    const departmentName =
      departments.find((dept) => dept.id === employee.department_id)?.name?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || departmentName.includes(query)
  })

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between space-x-4">
        <h2 className="text-2xl font-bold text-foreground">Employee Management</h2>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-white hover:bg-primary-dark text-xs py-1 px-3"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add New Employee
        </Button>
      </div>

      {/* Search Input */}
      <div className="mb-4 flex items-center space-x-2">
        <input
          type="text"
          className="input input-bordered w-64 sm:w-80 text-sm py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
          placeholder="Search by name or department"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Employee Table */}
      <Card className="border-none p-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Employee Type</TableCell>
                  <TableCell>Rate Per Day</TableCell>
                  <TableCell>Work Days Per Week</TableCell>
                  <TableCell>Hire Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-4 text-gray-500">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.id}</TableCell>
                      <TableCell>{`${employee.first_name} ${employee.last_name}`}</TableCell>
                      <TableCell>
                        {departments.find((dept) => dept.id === employee.department_id)?.name || "N/A"}
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.phone_number || "N/A"}</TableCell>
                      <TableCell>{employee.employee_type || "N/A"}</TableCell>
                      <TableCell>
                        {employee.rate_per_day != null
                          ? `₱${employee.rate_per_day.toLocaleString()}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>{employee.work_days_per_week || "N/A"}</TableCell>
                      <TableCell>{employee.hire_date || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          className="text-xs py-1 px-2"
                          onClick={() => {
                            setEmployeeToEdit(employee)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-xs py-1 px-2"
                          onClick={() => {
                            setEmployeeToDelete(employee)
                            setDeleteError(null)
                            setShowDeleteConfirmation(true)
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveEmployee}
      />

      {/* Edit Employee Modal */}
      {employeeToEdit && (
        <EditEmployeeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          employee={employeeToEdit}
          onSave={handleEditEmployee}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Are you sure you want to delete this employee?</h3>
            {deleteError && <p className="mb-4 text-red-600 font-semibold">{deleteError}</p>}
            <div className="flex justify-end space-x-4">
              <Button
                onClick={handleDeleteEmployee}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Delete
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirmation(false)
                  setEmployeeToDelete(null)
                  setDeleteError(null)
                }}
                className="bg-gray-500 text-white hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeManagement
