"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/integrations/supabase/client"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"

const TextInput: React.FC<{
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}> = ({ id, label, placeholder, value, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold">
      {label}
    </label>
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      className="input input-bordered w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
)

const DateInput: React.FC<{
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}> = ({ id, label, value, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold">
      {label}
    </label>
    <input
      id={id}
      type="date"
      className="input input-bordered w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
)

const AddEmployeeModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSave: (newEmployee: any) => void
}> = ({ isOpen, onClose, onSave }) => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [middleInitial, setMiddleInitial] = useState("")
  const [position, setPosition] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [baseSalary, setBaseSalary] = useState("")
  const [hireDate, setHireDate] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from("departments").select("*")
      if (error) {
        console.error("Error fetching departments:", error)
      } else {
        setDepartments(data || [])
      }
    }
    fetchDepartments()
  }, [])

  const handleSave = async () => {
    if (!firstName || !lastName || !middleInitial || !departmentId || !position || !phoneNumber || !baseSalary || !hireDate) {
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          first_name: firstName,
          last_name: lastName,
          middle_initial: middleInitial,
          department_id: departmentId,
          position,
          phone_number: phoneNumber,
          base_salary: parseFloat(baseSalary),
          hire_date: hireDate,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding employee:", error)
        setLoading(false)
        return
      }

      // Pass the database response
      onSave(data)

      // Reset form
      setFirstName("")
      setLastName("")
      setMiddleInitial("")
      setPosition("")
      setPhoneNumber("")
      setBaseSalary("")
      setHireDate("")
      setDepartmentId("")

      onClose()
    } catch (err) {
      console.error("Unexpected error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6 bg-white shadow-lg rounded-lg">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <TextInput
            id="firstName"
            label="First Name"
            placeholder="Enter First Name"
            value={firstName}
            onChange={setFirstName}
          />
          <TextInput
            id="lastName"
            label="Last Name"
            placeholder="Enter Last Name"
            value={lastName}
            onChange={setLastName}
          />
          <TextInput
            id="middleInitial"
            label="Middle Initial"
            placeholder="Enter Middle Initial"
            value={middleInitial}
            onChange={setMiddleInitial}
          />
          <TextInput
            id="position"
            label="Position"
            placeholder="Enter Position"
            value={position}
            onChange={setPosition}
          />
          <TextInput
            id="phoneNumber"
            label="Phone Number"
            placeholder="Enter Phone Number"
            value={phoneNumber}
            onChange={setPhoneNumber}
          />
          <TextInput
            id="baseSalary"
            label="Base Salary"
            placeholder="Enter Base Salary"
            value={baseSalary}
            onChange={setBaseSalary}
          />
          <DateInput
            id="hireDate"
            label="Hire Date"
            value={hireDate}
            onChange={setHireDate}
          />
          <div>
            <label htmlFor="department" className="block text-sm font-semibold">
              Department
            </label>
            <Select value={departmentId} onValueChange={(value) => setDepartmentId(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={loading || !firstName || !lastName || !middleInitial || !departmentId || !position || !phoneNumber || !baseSalary || !hireDate}
            className="bg-primary text-white hover:bg-primary-dark text-xs py-1 px-4"
          >
            {loading ? "Adding..." : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddEmployeeModal
