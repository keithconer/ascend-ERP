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

const NumericInput: React.FC<{
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}> = ({ id, label, placeholder, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9]/g, "")
    onChange(newValue)
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={placeholder}
        className="input input-bordered w-full"
        value={value}
        onChange={handleChange}
      />
    </div>
  )
}

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

    // Normalize employee type
    const normalizedEmployeeType = employeeType === "full-time" ? "Full-time" : "Part-time";

    setLoading(true)
    console.log("[v0] Starting employee insert...")

    // Remove non-numeric characters from Rate Per Day and convert to a number
    const parsedRatePerDay = Number.parseFloat(ratePerDay.replace(/[^0-9.-]+/g, "")) // Removing currency symbol and other non-numeric chars

    try {
      const employeeData = {
        first_name: firstName,
        last_name: lastName,
        middle_initial: middleInitial,
        department_id: Number(departmentId),
        position,
        phone_number: phoneNumber,
        hire_date: hireDate,
        employee_type: normalizedEmployeeType,
        rate_per_day: parsedRatePerDay,
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
            onChange={(value) => {
              if (/^[a-zA-Z\s]*$/.test(value)) {
                setFirstName(value)
              }
            }}
          />
          <TextInput
            id="lastName"
            label="Last Name"
            placeholder="Enter Last Name"
            value={lastName}
            onChange={(value) => {
              if (/^[a-zA-Z\s]*$/.test(value)) {
                setLastName(value)
              }
            }}
          />
          <div>
            <label htmlFor="middleInitial" className="block text-sm font-semibold">
              Middle Initial
            </label>
            <input
              id="middleInitial"
              type="text"
              maxLength={1}
              placeholder="M"
              className="input input-bordered w-full"
              value={middleInitial}
              onChange={(e) => {
                const value = e.target.value.toUpperCase()
                if (/^[A-Z]*$/.test(value)) {
                  setMiddleInitial(value)
                }
              }}
            />
          </div>
          <TextInput
            id="position"
            label="Position"
            placeholder="Enter Position"
            value={position}
            onChange={(value) => {
              if (/^[a-zA-Z\s]*$/.test(value)) {
                setPosition(value)
              }
            }}
          />
          <NumericInput
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
                  <SelectItem key={dept.id} value={dept.id.toString()}>
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
          <NumericInput
            id="ratePerDay"
            label="Rate Per Day (₱)"
            placeholder="Enter Rate Per Day in Pesos"
            value={ratePerDay}
            onChange={setRatePerDay}
          />
          <NumericInput
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
          >
            {loading ? "Saving..." : "Save Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddEmployeeModal
