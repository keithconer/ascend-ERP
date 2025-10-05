"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import AddEmployeeModal from "./AddEmployeeModal"
import EditEmployeeModal from "./EditEmployeeModal"

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [employeeToEdit, setEmployeeToEdit] = useState<any | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      // Fetching employee data
      const { data: employeeData, error: employeeError } = await supabase.from("employees").select("*")
      if (employeeError) {
        console.error("Error fetching employees:", employeeError)
      } else {
        setEmployees(employeeData || [])
      }

      // Fetching department data
      const { data: departmentData, error: departmentError } = await supabase.from("departments").select("*")
      if (departmentError) {
        console.error("Error fetching departments:", departmentError)
      } else {
        setDepartments(departmentData || [])
      }
    }
    fetchData()
  }, [])

  const handleSaveEmployee = (newEmployee: any) => {
    setEmployees((prevEmployees) => [...prevEmployees, newEmployee])
    setIsModalOpen(false)
  }

  const handleEditEmployee = (updatedEmployee: any) => {
    setEmployees((prevEmployees) => prevEmployees.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp)))
    setIsEditModalOpen(false)
    setEmployeeToEdit(null)
  }

  const handleDeleteEmployee = async () => {
    if (employeeToDelete) {
      const { error } = await supabase.from("employees").delete().eq("id", employeeToDelete.id)

      if (error) {
        console.error("Error deleting employee:", error)
      } else {
        setEmployees((prevEmployees) => prevEmployees.filter((emp) => emp.id !== employeeToDelete.id))
        setShowDeleteConfirmation(false)
        setEmployeeToDelete(null)
      }
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase()
    const departmentName = departments.find((dept) => dept.id === employee.department_id)?.name?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()

    return fullName.includes(query) || departmentName.includes(query)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-x-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Employee Management</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white hover:bg-primary-dark text-xs py-1 px-3"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add New Employee
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <input
          type="text"
          className="input input-bordered w-64 sm:w-80 text-sm py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
          placeholder="Search by name or department"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

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
                {filteredEmployees.map((employee) => (
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
                      {employee.rate_per_day
                        ? `₱${employee.rate_per_day.toLocaleString()}` // Format as Pesos
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
                          setShowDeleteConfirmation(true)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEmployee} />

      {employeeToEdit && (
        <EditEmployeeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          employee={employeeToEdit}
          onSave={handleEditEmployee}
        />
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold">Are you sure you want to delete this employee?</h3>
            <div className="mt-4 flex space-x-4">
              <Button onClick={handleDeleteEmployee} className="bg-red-600 text-white hover:bg-red-700">
                Yes, Delete
              </Button>
              <Button
                onClick={() => setShowDeleteConfirmation(false)}
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
