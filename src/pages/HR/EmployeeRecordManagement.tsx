import React, { useState, useEffect } from 'react';
import { User, Building, FileText, Clock, Shield, Plus, Edit, Trash2, Search, Filter, Upload, AlertCircle, Loader, Home } from 'lucide-react';

// Types matching Supabase schema
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  job_title: string;
  department: string;
  salary?: number;
  hire_date: string;
  contract_type: 'full-time' | 'part-time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'terminated';
  created_at: string;
  updated_at: string;
}

interface Certificate {
  id: string;
  employee_id: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  file_url?: string;
  status: 'active' | 'expired' | 'pending';
  created_at: string;
  updated_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface TimeRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out?: string;
  break_time: number;
  total_hours: number;
  status: 'present' | 'absent' | 'late' | 'early-leave';
  notes?: string;
  created_at: string;
  updated_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Service functions - Ready for Supabase integration
const employeeService = {
  async getAllEmployees(): Promise<Employee[]> {
    // TODO: Replace with actual Supabase query
    // const { data, error } = await supabase
    //   .from('employees')
    //   .select('*')
    //   .order('created_at', { ascending: false });
    // if (error) throw error;
    // return data || [];
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  },

  async createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    // TODO: Replace with actual Supabase query
    // const { data, error } = await supabase
    //   .from('employees')
    //   .insert([employee])
    //   .select()
    //   .single();
    // if (error) throw error;
    // return data;
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    // TODO: Replace with actual Supabase query
    // const { data, error } = await supabase
    //   .from('employees')
    //   .update(updates)
    //   .eq('id', id)
    //   .select()
    //   .single();
    // if (error) throw error;
    // return data;
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  },

  async deleteEmployee(id: string): Promise<void> {
    // TODO: Replace with actual Supabase query
    // const { error } = await supabase
    //   .from('employees')
    //   .delete()
    //   .eq('id', id);
    // if (error) throw error;
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  },

  async searchEmployees(searchTerm: string, department?: string): Promise<Employee[]> {
    // TODO: Replace with actual Supabase query
    // let query = supabase
    //   .from('employees')
    //   .select('*');
    
    // if (searchTerm) {
    //   query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%`);
    // }
    
    // if (department) {
    //   query = query.eq('department', department);
    // }
    
    // const { data, error } = await query.order('created_at', { ascending: false });
    // if (error) throw error;
    // return data || [];
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  }
};

const certificateService = {
  async getAllCertificates(): Promise<Certificate[]> {
    // TODO: Replace with actual Supabase query
    // const { data, error } = await supabase
    //   .from('certificates')
    //   .select(`
    //     *,
    //     employees (
    //       first_name,
    //       last_name,
    //       email
    //     )
    //   `)
    //   .order('created_at', { ascending: false });
    // if (error) throw error;
    // return data || [];
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  },

  async createCertificate(cert: Omit<Certificate, 'id' | 'created_at' | 'updated_at'>): Promise<Certificate> {
    // TODO: Replace with actual Supabase query
    // const { data, error } = await supabase
    //   .from('certificates')
    //   .insert([cert])
    //   .select(`
    //     *,
    //     employees (
    //       first_name,
    //       last_name,
    //       email
    //     )
    //   `)
    //   .single();
    // if (error) throw error;
    // return data;
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  },

  async updateCertificate(id: string, updates: Partial<Certificate>): Promise<Certificate> {
    // TODO: Replace with actual Supabase query
    // const { data, error } = await supabase
    //   .from('certificates')
    //   .update(updates)
    //   .eq('id', id)
    //   .select(`
    //     *,
    //     employees (
    //       first_name,
    //       last_name,
    //       email
    //     )
    //   `)
    //   .single();
    // if (error) throw error;
    // return data;
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  },

  async deleteCertificate(id: string): Promise<void> {
    // TODO: Replace with actual Supabase query
    // const { error } = await supabase
    //   .from('certificates')
    //   .delete()
    //   .eq('id', id);
    // if (error) throw error;
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  }
};

const timeRecordService = {
  async getAllTimeRecords(): Promise<TimeRecord[]> {
    // TODO: Replace with actual Supabase query
    // const { data, error } = await supabase
    //   .from('time_records')
    //   .select(`
    //     *,
    //     employees (
    //       first_name,
    //       last_name,
    //       email
    //     )
    //   `)
    //   .order('date', { ascending: false });
    // if (error) throw error;
    // return data || [];
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  },

  async createTimeRecord(record: Omit<TimeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TimeRecord> {
    // TODO: Replace with actual Supabase query
    // const { data, error } = await supabase
    //   .from('time_records')
    //   .insert([record])
    //   .select(`
    //     *,
    //     employees (
    //       first_name,
    //       last_name,
    //       email
    //     )
    //   `)
    //   .single();
    // if (error) throw error;
    // return data;
    
    throw new Error('Supabase not connected. Please configure your Supabase client.');
  }
};

export default function EmployeeManagementSystem() {
  const [activeTab, setActiveTab] = useState<'employees' | 'certificates' | 'timeTracking'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'employees') {
        const employeesData = await employeeService.getAllEmployees();
        setEmployees(employeesData);
      } else if (activeTab === 'certificates') {
        const certificatesData = await certificateService.getAllCertificates();
        setCertificates(certificatesData);
      } else if (activeTab === 'timeTracking') {
        const timeRecordsData = await timeRecordService.getAllTimeRecords();
        setTimeRecords(timeRecordsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments for filter
  const departments = [...new Set(employees.map(emp => emp.department))];

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = `${emp.first_name} ${emp.last_name} ${emp.email} ${emp.job_title}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || emp.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  // Employee Modal Component
  const EmployeeModal = () => {
    const [formData, setFormData] = useState<Partial<Employee>>(
      selectedEmployee ? {
        first_name: selectedEmployee.first_name,
        last_name: selectedEmployee.last_name,
        email: selectedEmployee.email,
        phone: selectedEmployee.phone,
        address: selectedEmployee.address,
        job_title: selectedEmployee.job_title,
        department: selectedEmployee.department,
        salary: selectedEmployee.salary,
        hire_date: selectedEmployee.hire_date,
        contract_type: selectedEmployee.contract_type,
        status: selectedEmployee.status
      } : {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        job_title: '',
        department: '',
        salary: 0,
        hire_date: '',
        contract_type: 'full-time',
        status: 'active'
      }
    );
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      try {
        setSaving(true);
        
        if (selectedEmployee) {
          // Update existing employee
          const updatedEmployee = await employeeService.updateEmployee(selectedEmployee.id, formData);
          setEmployees(prev => prev.map(emp => 
            emp.id === selectedEmployee.id ? updatedEmployee : emp
          ));
        } else {
          // Add new employee
          const newEmployee = await employeeService.createEmployee(formData as Omit<Employee, 'id' | 'created_at' | 'updated_at'>);
          setEmployees(prev => [newEmployee, ...prev]);
        }
        
        setShowEmployeeModal(false);
        setSelectedEmployee(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save employee');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <button
              onClick={() => {
                setShowEmployeeModal(false);
                setSelectedEmployee(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Job Title *</label>
              <input
                type="text"
                value={formData.job_title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Department *</label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Salary</label>
              <input
                type="number"
                value={formData.salary || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, salary: Number(e.target.value) }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Hire Date *</label>
              <input
                type="date"
                value={formData.hire_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Contract Type</label>
              <select
                value={formData.contract_type || 'full-time'}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_type: e.target.value as Employee['contract_type'] }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Employee['status'] }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-2">
            <button
              onClick={() => {
                setShowEmployeeModal(false);
                setSelectedEmployee(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving && <Loader size={16} className="animate-spin" />}
              <span>{saving ? 'Saving...' : selectedEmployee ? 'Update' : 'Add'} Employee</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Certificate Modal Component
  const CertificateModal = () => {
    const [formData, setFormData] = useState({
      employee_id: '',
      title: '',
      issuer: '',
      issue_date: '',
      expiry_date: '',
      status: 'active' as Certificate['status']
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      try {
        setSaving(true);
        const newCertificate = await certificateService.createCertificate(formData);
        setCertificates(prev => [newCertificate, ...prev]);
        setShowCertificateModal(false);
        setFormData({
          employee_id: '',
          title: '',
          issuer: '',
          issue_date: '',
          expiry_date: '',
          status: 'active'
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add certificate');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Add Certificate</h2>
            <button
              onClick={() => setShowCertificateModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employee *</label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Certificate Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Issuer *</label>
              <input
                type="text"
                value={formData.issuer}
                onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Issue Date *</label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-2">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving && <Loader size={16} className="animate-spin" />}
              <span>{saving ? 'Adding...' : 'Add Certificate'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const deleteEmployee = async (id: string) => {
    try {
      await employeeService.deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  const deleteCertificate = async (id: string) => {
    try {
      await certificateService.deleteCertificate(id);
      setCertificates(prev => prev.filter(cert => cert.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete certificate');
    }
  };

  // Loading component
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader size={24} className="animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Employee Records & Information Management
              </h1>
              <p className="text-gray-600">
                Comprehensive system for managing employee data, certifications, and time tracking              </p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              title="Go to Dashboard"
            >
              <Home size={18} />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'employees', label: 'Employee Records', icon: User },
              { key: 'certificates', label: 'Certifications & Licenses', icon: FileText },
              { key: 'timeTracking', label: 'Time Tracking', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Employee Records Tab */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Controls */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Employee Records</h2>
                <button
                  onClick={() => setShowEmployeeModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus size={18} />
                  <span>Add Employee</span>
                </button>
              </div>
              
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="w-48">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Employee List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hire Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {searchTerm || departmentFilter ? 'No employees found matching your criteria.' : 'No employees found. Click "Add Employee" to get started.'}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{employee.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.job_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(employee.hire_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : employee.status === 'inactive'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowEmployeeModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Employee"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteEmployee(employee.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Employee"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Certifications & Licenses</h2>
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus size={18} />
                  <span>Add Certificate</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issuer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {certificates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No certificates found. Click "Add Certificate" to get started.
                      </td>
                    </tr>
                  ) : (
                    certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cert.employees ? `${cert.employees.first_name} ${cert.employees.last_name}` : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cert.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cert.issuer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(cert.issue_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cert.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : cert.status === 'expired'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900" title="Upload File">
                              <Upload size={16} />
                            </button>
                            <button 
                              onClick={() => deleteCertificate(cert.id)}
                              className="text-red-600 hover:text-red-900" 
                              title="Delete Certificate"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Time Tracking Tab */}
        {activeTab === 'timeTracking' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Time Tracking</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No time records found.
                      </td>
                    </tr>
                  ) : (
                    timeRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.employees ? `${record.employees.first_name} ${record.employees.last_name}` : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.clock_in}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.clock_out || 'Not clocked out'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.total_hours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'present' 
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : record.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        {showEmployeeModal && <EmployeeModal />}
        {showCertificateModal && <CertificateModal />}
      </div>
    </div>
  );
}