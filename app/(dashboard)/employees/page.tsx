'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DataTableAdvanced } from '@/components/ui/data-table-advanced';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import { useEmployees, useProjects } from '@/hooks/use-data';

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, importEmployees, exportEmployees } =
    useEmployees();
  const { projects } = useProjects();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    employee_id: '',
    iqama_number: '',
    phone_number: '',
    role: '',
    date_of_join: '',
    nationality: '',
    project_id: 'Unassigned',
    status: 'Unpaid',
  });

  const resetForm = () => {
    setEmployeeForm({
      name: '',
      employee_id: '',
      iqama_number: '',
      phone_number: '',
      role: '',
      date_of_join: '',
      nationality: '',
      project_id: 'Unassigned',
      status: 'Unpaid',
    });
    setEditingEmployee(null);
  };

  // Add/Edit Employee
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const empData = {
        ...employeeForm,
        project_id: employeeForm.project_id === 'Unassigned' ? null : employeeForm.project_id,
      };
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, empData);
        toast.success('Employee updated successfully!');
        setIsEditDialogOpen(false);
      } else {
        await addEmployee(empData);
        toast.success('Employee added successfully!');
        setIsAddDialogOpen(false);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('Error saving employee');
    }
  };

  // Edit button
  const handleEdit = (emp: any) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      name: emp.name || '',
      employee_id: emp.employee_id || '',
      iqama_number: emp.iqama_number || '',
      phone_number: emp.phone_number || '',
      role: emp.role || '',
      date_of_join: emp.date_of_join || '',
      nationality: emp.nationality || '',
      project_id: emp.project_id || 'Unassigned',
      status: emp.status || 'Unpaid',
    });
    setIsEditDialogOpen(true);
  };

  // Delete button
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await deleteEmployee(id);
      toast.success('Employee deleted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Error deleting employee');
    }
  };

  // Import file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importEmployees(file);
      toast.success('Employees imported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to import employees');
    } finally {
      e.target.value = '';
    }
  };

  const columns = [
    {
      accessor: 'name',
      header: 'Employee',
      cell: ({ getValue, row }: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-emerald-600">{getInitials(getValue())}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{getValue()}</p>
            <p className="text-xs text-muted-foreground">ID: {row.employee_id || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    { accessor: 'employee_id', header: 'Employee ID' },
    { accessor: 'role', header: 'Role/Trade' },
    {
      accessor: 'month_joined',
      header: 'Month Joined',
      cell: ({ row }: any) =>
        row.date_of_join
          ? new Date(row.date_of_join).toLocaleString('default', { month: 'long', year: 'numeric' })
          : '',
    },
    { accessor: 'nationality', header: 'Nationality' },
    {
      accessor: 'project_id',
      header: 'Project',
      cell: ({ getValue }: any) => projects.find((p) => p.id === getValue())?.name || 'Unassigned',
    },
    {
      accessor: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Select
          value={row.status || 'Unpaid'}
          onValueChange={async (v) => await updateEmployee(row.id, { status: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employees</h1>
            <p className="text-muted-foreground font-light">Manage your workforce and projects</p>
          </div>

          <div className="flex space-x-2">
            {/* Import */}
            <label className="px-4 py-2 border rounded cursor-pointer hover:bg-gray-100">
              Import
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Export */}
            <Button onClick={exportEmployees} variant="outline">
              Export
            </Button>

            {/* Add */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-accent rounded-xl flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Full Name"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Employee ID"
                    value={employeeForm.employee_id}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, employee_id: e.target.value }))}
                  />
                  <Input
                    placeholder="Iqama Number"
                    value={employeeForm.iqama_number}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, iqama_number: e.target.value }))}
                  />
                  <Input
                    placeholder="Phone Number"
                    value={employeeForm.phone_number}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                  />
                  <Input
                    placeholder="Role/Trade"
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, role: e.target.value }))}
                    required
                  />
                  <Input
                    type="date"
                    placeholder="Date of Join"
                    value={employeeForm.date_of_join}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, date_of_join: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Nationality"
                    value={employeeForm.nationality}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, nationality: e.target.value }))}
                    required
                  />
                  <Select
                    value={employeeForm.project_id || 'Unassigned'}
                    onValueChange={(v) =>
                      setEmployeeForm((prev) => ({ ...prev, project_id: v === 'Unassigned' ? null : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={employeeForm.status || 'Unpaid'}
                    onValueChange={(v) => setEmployeeForm((prev) => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingEmployee ? 'Update' : 'Add'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Employee Table */}
        <DataTableAdvanced
          data={employees}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={false}
          emptyMessage="No employees found."
        />
      </motion.div>
    </div>
  );
}

