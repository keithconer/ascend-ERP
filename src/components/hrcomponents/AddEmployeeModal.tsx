"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/integrations/supabase/client"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

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

interface AddEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newEmployee: any) => void
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [middleInitial, setMiddleInitial] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [position, setPosition] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [hireDate, setHireDate] = useState("")
  const [employeeType, setEmployeeType] = useState("")
  const [ratePerDay, setRatePerDay] = useState("")
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState("")
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

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
    if (
      !firstName ||
      !lastName ||
      !middleInitial ||
      !departmentId ||
      !position ||
      !phoneNumber ||
      !hireDate ||
      !employeeType ||
      !ratePerDay ||
      !workDaysPerWeek
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
  
    // Ensure employeeType is in the correct case
    const normalizedEmployeeType = employeeType === "full-time" ? "Full-time" : "Part-time";
  
    setLoading(true)
    console.log("[v0] Starting employee insert...")
  
    try {
      const employeeData = {
        first_name: firstName,
        last_name: lastName,
        middle_initial: middleInitial,
        department_id: String(departmentId),
        position,
        phone_number: phoneNumber,
        hire_date: hireDate,
        employee_type: normalizedEmployeeType, // Ensure the correct value is passed
        rate_per_day: Number.parseFloat(ratePerDay),
        work_days_per_week: Number.parseInt(workDaysPerWeek),
      }
  
      console.log("[v0] Employee data to insert:", employeeData)
  
      const { data, error } = await supabase.from("employees").insert(employeeData).select().single()
  
      console.log("[v0] Insert response - data:", data, "error:", error)
  
      if (error) {
        console.error("[v0] Error adding employee:", error)
        toast({
          title: "Error",
          description: `Failed to add employee: ${error.message}`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }
  
      console.log("[v0] Employee added successfully:", data)
  
      toast({
        title: "Success",
        description: "Employee added successfully",
      })
  
      onSave(data)
  
      setFirstName("")
      setLastName("")
      setMiddleInitial("")
      setDepartmentId("")
      setPosition("")
      setPhoneNumber("")
      setHireDate("")
      setEmployeeType("")
      setRatePerDay("")
      setWorkDaysPerWeek("")
  
      onClose()
    } catch (err) {
      console.error("[v0] Unexpected error:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6 bg-white shadow-lg rounded-lg max-h-[90vh] overflow-y-auto">
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
          <DateInput id="hireDate" label="Hire Date" value={hireDate} onChange={setHireDate} />
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
          <div>
            <label htmlFor="employeeType" className="block text-sm font-semibold">
              Employee Type
            </label>
            <Select value={employeeType} onValueChange={(value) => setEmployeeType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Employee Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-Time</SelectItem>
                <SelectItem value="part-time">Part-Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TextInput
            id="ratePerDay"
            label="Rate Per Day"
            placeholder="Enter Rate Per Day"
            value={ratePerDay}
            onChange={setRatePerDay}
          />
          <TextInput
            id="workDaysPerWeek"
            label="Work Days Per Week"
            placeholder="Enter Work Days Per Week"
            value={workDaysPerWeek}
            onChange={setWorkDaysPerWeek}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={
              loading ||
              !firstName ||
              !lastName ||
              !middleInitial ||
              !departmentId ||
              !position ||
              !phoneNumber ||
              !hireDate ||
              !employeeType ||
              !ratePerDay ||
              !workDaysPerWeek
            }
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
