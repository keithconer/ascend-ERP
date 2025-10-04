"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Plus, Edit2, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

type AttendanceStatus = "present" | "absent" | "late" | "leave" | "clocked_in"

interface Employee {
  id: string
  first_name: string
  last_name: string
  middle_initial: string
  department_id: string
  position: string
}

interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  time_in: string
  time_out: string
  hours_worked: number
  status: AttendanceStatus
  employee_name?: string
}

const Attendance = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [timeIn, setTimeIn] = useState<string>("")
  const [timeOut, setTimeOut] = useState<string>("")
  const [status, setStatus] = useState<AttendanceStatus>("present")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date())
  const { toast } = useToast()

  useEffect(() => {
    fetchEmployees()
    fetchAttendanceRecords()
  }, [])

  useEffect(() => {
    fetchAttendanceRecords()
  }, [filterDate])

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("*")
    if (error) {
      console.error("[v0] Error fetching employees:", error)
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      })
    } else {
      setEmployees(data || [])
    }
  }

  const fetchAttendanceRecords = async () => {
    let query = supabase
      .from("attendance")
      .select(`
        *,
        employees (
          first_name,
          last_name
        )
      `)
      .order("date", { ascending: false })
      .order("time_in", { ascending: false })

    if (filterDate) {
      const dateStr = format(filterDate, "yyyy-MM-dd")
      query = query.eq("date", dateStr)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching attendance:", error)
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      })
    } else {
      const mappedData = (data || []).map((record: any) => ({
        ...record,
        employee_name: record.employees ? `${record.employees.first_name} ${record.employees.last_name}` : "Unknown",
      }))
      setAttendanceRecords(mappedData)
    }
  }

  const calculateStatus = (
    timeIn: string,
    timeOut: string | null,
    manualStatus?: AttendanceStatus,
  ): AttendanceStatus => {
    if (manualStatus === "absent" || manualStatus === "leave") {
      return manualStatus
    }

    if (!timeOut) {
      return "clocked_in"
    }

    const [hours, minutes] = timeIn.split(":").map(Number)
    const timeInMinutes = hours * 60 + minutes
    const standardStartTime = 9 * 60 // 9:00 AM in minutes

    if (timeInMinutes > standardStartTime + 15) {
      return "late"
    }

    return "present"
  }

  const validateTimes = (timeIn: string, timeOut: string): boolean => {
    if (!timeIn || timeIn.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Please enter time in",
        variant: "destructive",
      })
      return false
    }

    // Only validate time out if it has a value
    if (timeOut && timeOut.trim() !== "") {
      const [inHours, inMinutes] = timeIn.split(":").map(Number)
      const [outHours, outMinutes] = timeOut.split(":").map(Number)

      const timeInMinutes = inHours * 60 + inMinutes
      const timeOutMinutes = outHours * 60 + outMinutes

      if (timeOutMinutes <= timeInMinutes) {
        toast({
          title: "Validation Error",
          description: "Time out must be after time in",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const handleRecordAttendance = async () => {
    if (!selectedEmployee || !date) {
      toast({
        title: "Validation Error",
        description: "Please select an employee and date",
        variant: "destructive",
      })
      return
    }

    if (status !== "absent" && status !== "leave") {
      if (!validateTimes(timeIn, timeOut)) {
        return
      }
    }

    const dateStr = format(date, "yyyy-MM-dd")

    const { data: existingRecord, error: checkError } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", selectedEmployee.id)
      .eq("date", dateStr)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking existing attendance:", checkError)
      toast({
        title: "Error",
        description: "Failed to check existing attendance",
        variant: "destructive",
      })
      return
    }

    if (existingRecord && !existingRecord.time_out && timeOut && timeOut.trim() !== "") {
      let hoursWorked = 0
      if (existingRecord.time_in && timeOut) {
        const timeInObj = new Date(`1970-01-01T${existingRecord.time_in}:00`)
        const timeOutObj = new Date(`1970-01-01T${timeOut}:00`)
        hoursWorked = (timeOutObj.getTime() - timeInObj.getTime()) / 1000 / 3600
      }

      const finalStatus = calculateStatus(existingRecord.time_in, timeOut, status)

      const { error: updateError } = await supabase
        .from("attendance")
        .update({
          time_out: timeOut,
          hours_worked: hoursWorked,
          status: finalStatus,
        })
        .eq("id", existingRecord.id)
        .select()
        .single()

      if (updateError) {
        console.error("[v0] Error updating attendance:", updateError)
        toast({
          title: "Error",
          description: "Failed to update attendance",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Clock out recorded successfully",
        })
        fetchAttendanceRecords()
        resetForm()
        setIsRecordModalOpen(false)
      }
      return
    }

    if (existingRecord && existingRecord.time_out) {
      toast({
        title: "Record Already Exists",
        description: "This employee already has a complete attendance record for this date. Use Edit to modify it.",
        variant: "destructive",
      })
      return
    }

    let hoursWorked = 0
    const cleanTimeOut = timeOut && timeOut.trim() !== "" ? timeOut : null

    if (timeIn && cleanTimeOut && status !== "absent" && status !== "leave") {
      const timeInObj = new Date(`1970-01-01T${timeIn}:00`)
      const timeOutObj = new Date(`1970-01-01T${cleanTimeOut}:00`)
      hoursWorked = (timeOutObj.getTime() - timeInObj.getTime()) / 1000 / 3600
    }

    const finalStatus = calculateStatus(timeIn, cleanTimeOut, status)

    const { data, error } = await supabase
      .from("attendance")
      .insert({
        employee_id: selectedEmployee.id,
        date: dateStr,
        time_in: timeIn || null,
        time_out: cleanTimeOut,
        hours_worked: hoursWorked,
        status: finalStatus,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error recording attendance:", error)
      toast({
        title: "Error",
        description: "Failed to record attendance",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: cleanTimeOut ? "Attendance recorded successfully" : "Clock in recorded successfully",
      })
      fetchAttendanceRecords()
      resetForm()
      setIsRecordModalOpen(false)
    }
  }

  const handleEditAttendance = async () => {
    if (!editingRecord || !date) return

    if (status !== "absent" && status !== "leave") {
      if (!validateTimes(timeIn, timeOut)) {
        return
      }
    }

    const cleanTimeOut = timeOut && timeOut.trim() !== "" ? timeOut : null

    let hoursWorked = 0
    if (timeIn && cleanTimeOut && status !== "absent" && status !== "leave") {
      const timeInObj = new Date(`1970-01-01T${timeIn}:00`)
      const timeOutObj = new Date(`1970-01-01T${cleanTimeOut}:00`)
      hoursWorked = (timeOutObj.getTime() - timeInObj.getTime()) / 1000 / 3600
    }

    const finalStatus = calculateStatus(timeIn, cleanTimeOut, status)

    const dateStr = format(date, "yyyy-MM-dd")

    const { data, error } = await supabase
      .from("attendance")
      .update({
        date: dateStr,
        time_in: timeIn || null,
        time_out: cleanTimeOut,
        hours_worked: hoursWorked,
        status: finalStatus,
      })
      .eq("id", editingRecord.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating attendance:", error)
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Attendance updated successfully",
      })
      fetchAttendanceRecords()
      resetForm()
      setIsEditModalOpen(false)
      setEditingRecord(null)
    }
  }

  const resetForm = () => {
    setSelectedEmployee(null)
    setDate(new Date())
    setTimeIn("")
    setTimeOut("")
    setStatus("present")
  }

  const openEditModal = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setDate(new Date(record.date))
    setTimeIn(record.time_in || "")
    setTimeOut(record.time_out || "")
    setStatus(record.status)
    setIsEditModalOpen(true)
  }

  const getStatusBadge = (status: AttendanceStatus) => {
    const variants: Record<AttendanceStatus, { variant: any; label: string }> = {
      present: { variant: "default", label: "Present" },
      absent: { variant: "destructive", label: "Absent" },
      late: { variant: "secondary", label: "Late" },
      leave: { variant: "outline", label: "Leave" },
      clocked_in: { variant: "secondary", label: "Clocked In" },
    }
    const config = variants[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-x-4">
        <h2 className="text-2xl font-bold text-foreground">Attendance Management</h2>
        <div className="flex space-x-4">
          <Button
            onClick={() => {
              resetForm()
              setIsRecordModalOpen(true)
            }}
            className="bg-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Attendance
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by Date (Today by default):</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !filterDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, "PPP") : "All dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus />
              </PopoverContent>
            </Popover>
            {filterDate && (
              <Button variant="ghost" onClick={() => setFilterDate(undefined)}>
                Clear Filter (Show All)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none p-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time In</TableCell>
                  <TableCell>Time Out</TableCell>
                  <TableCell>Hours Worked</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.employee_name}</TableCell>
                      <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{record.time_in || "-"}</TableCell>
                      <TableCell>{record.time_out || "-"}</TableCell>
                      <TableCell>{record.hours_worked ? `${record.hours_worked.toFixed(2)}h` : "-"}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(record)}>
                          <Edit2 className="h-4 w-4" />
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

      <Dialog
        open={isRecordModalOpen}
        onOpenChange={(open) => {
          setIsRecordModalOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Attendance (Clock In/Out)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <Select
                value={selectedEmployee?.id}
                onValueChange={(value) => setSelectedEmployee(employees.find((emp) => emp.id === value) || null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as AttendanceStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status !== "absent" && status !== "leave" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time In (Required)</Label>
                  <Input type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center justify-between">
                    Time Out (Optional)
                    {timeOut && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setTimeOut("")}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </Label>
                  <Input type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} />
                </div>
              </div>
            )}
            {status !== "absent" && status !== "leave" && (
              <p className="text-sm text-muted-foreground">
                Tip: Leave Time Out empty to clock in only. You can add Time Out later by recording again for the same
                employee and date.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRecordModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordAttendance} disabled={!selectedEmployee || !date}>
              Record Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open)
          if (!open) {
            resetForm()
            setEditingRecord(null)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <Input value={editingRecord?.employee_name || ""} disabled className="bg-muted" />
            </div>

            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as AttendanceStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status !== "absent" && status !== "leave" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time In (Required)</Label>
                  <Input type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center justify-between">
                    Time Out (Optional)
                    {timeOut && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setTimeOut("")}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </Label>
                  <Input type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false)
                resetForm()
                setEditingRecord(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditAttendance} disabled={!date}>
              Update Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Attendance
