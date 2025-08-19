'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

import { DataTableAdvanced } from '@/components/ui/data-table-advanced';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

import { useEmployees, useProjects, usePayrolls, useAdvances } from '@/hooks/use-data';
import type { Payroll } from '@/lib/supabase';

export default function PayrollPage() {
  const { employees } = useEmployees();
  const { projects } = useProjects();
  const { payrolls, addPayroll, updatePayroll, deletePayroll, fetchPayrolls } = usePayrolls();
  const { totalAdvanceFor } = useAdvances();

  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    employee_id: '',
    project_id: '',
    month: '',
    hours_worked: 0,
    rate: 0,
    salary: 0,
    final_pay: 0,
    status: 'Unpaid',
  });

  const [filters, setFilters] = useState({
    project: 'all',
    month: '',
    status: 'all',
    nationality: 'all',
    search: '',
  });

  // -------------------- Auto-calculation --------------------
  const calculateSalary = (hours: number, rate: number) => hours * rate;

  const recalcPayroll = (form: typeof payrollForm) => {
    const salary = calculateSalary(form.hours_worked, form.rate);
    return {
      ...form,
      salary,
      final_pay: salary - (totalAdvanceFor(form.employee_id) || 0),
    };
  };

  // -------------------- Add / Edit / Delete --------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = recalcPayroll(payrollForm);

      if (editingPayroll) await updatePayroll(editingPayroll.id, payload);
      else await addPayroll(payload);

      toast.success(`Payroll ${editingPayroll ? 'updated' : 'added'} successfully`);
      resetForm();
      fetchPayrolls();
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error saving payroll');
    }
  };

  const handleEdit = (p: Payroll) => {
    setEditingPayroll(p);
    setPayrollForm({
      employee_id: p.employee_id,
      project_id: p.project_id,
      month: p.month,
      hours_worked: p.hours_worked,
      rate: p.rate || 0,
      salary: p.salary || 0,
      final_pay: p.final_pay || 0,
      status: p.status || 'Unpaid',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (p: Payroll) => {
    if (window.confirm('Are you sure you want to delete this payroll?')) {
      await deletePayroll(p.id);
      toast.success('Payroll deleted successfully');
      fetchPayrolls();
    }
  };

  const resetForm = () => {
    setPayrollForm({
      employee_id: '',
      project_id: '',
      month: '',
      hours_worked: 0,
      rate: 0,
      salary: 0,
      final_pay: 0,
      status: 'Unpaid',
    });
    setEditingPayroll(null);
  };

  // -------------------- Import / Export --------------------
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      for (const row of json) {
        const emp = employees.find(e => e.employee_id === row['Employee ID']);
        const proj = projects.find(p => p.name === row['Project']);
        if (!emp || !proj) continue;

        const hours = Number(row['Hours Worked'] || 0);
        const rate = Number(row['Rate'] || proj.trades?.find(t => t.name === emp.role)?.rate || 0);
        const salary = calculateSalary(hours, rate);

        await addPayroll({
          employee_id: emp.id,
          project_id: proj.id,
          month: row['Month'],
          hours_worked: hours,
          rate,
          salary,
          final_pay: salary - (totalAdvanceFor(emp.id) || 0),
          status: row['Status'] || 'Unpaid',
        });
      }

      toast.success('Payroll imported successfully');
      fetchPayrolls();
    } catch (err) {
      console.error(err);
      toast.error('Import failed');
    }
  };

  const handleExport = () => {
    const data = payrolls.map(p => {
      const emp = employees.find(e => e.id === p.employee_id);
      const proj = projects.find(pr => pr.id === p.project_id);
      return {
        'Employee Name': emp?.name,
        'Employee ID': emp?.employee_id,
        'Role/Trade': emp?.role,
        'Rate': p.rate,
        'Project': proj?.name,
        'Month Joined': emp?.month_joined,
        'Hours Worked': p.hours_worked,
        'Salary': p.salary,
        'Final Pay': p.final_pay,
        'Status': p.status,
        'Nationality': emp?.nationality,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
    XLSX.writeFile(workbook, `Payroll_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // -------------------- Filtered Data --------------------
  const filteredData = payrolls.map(p => {
    const emp = employees.find(e => e.id === p.employee_id);
    const proj = projects.find(pr => pr.id === p.project_id);
    return {
      ...p,
      employee_name: emp?.name || '',
      employee_id: emp?.employee_id || '',
      role: emp?.role || '',
      rate: p.rate || 0,
      project_name: proj?.name || '',
      month_joined: emp?.month_joined || '',
      nationality: emp?.nationality || '',
      hours_worked: p.hours_worked,
      salary: p.salary,
      final_pay: p.final_pay,
      status: p.status || 'Unpaid',
    };
  }).filter(p =>
    (filters.project === 'all' || p.project_name === filters.project) &&
    (!filters.month || p.month === filters.month) &&
    (filters.status === 'all' || p.status === filters.status) &&
    (filters.nationality === 'all' || p.nationality === filters.nationality) &&
    (!filters.search || p.employee_name.toLowerCase().includes(filters.search.toLowerCase()) || p.employee_id.includes(filters.search))
  );

  // -------------------- Bulk Status Update --------------------
  const handleBulkStatus = async (projectName: string, newStatus: string) => {
    const projectPayrolls = payrolls.filter(p => {
      const proj = projects.find(pr => pr.id === p.project_id);
      return proj?.name === projectName;
    });
    for (const p of projectPayrolls) {
      await updatePayroll(p.id, { status: newStatus });
    }
    toast.success(`All employees in ${projectName} updated to ${newStatus}`);
    fetchPayrolls();
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-3xl font-bold">Payroll</h1>
          <div className="flex space-x-2 flex-wrap">
            <input type="file" accept=".xlsx, .csv" onChange={handleImport} className="hidden" id="import-file" />
            <label htmlFor="import-file">
              <Button variant="outline">Import Excel</Button>
            </label>
            <Button variant="outline" onClick={handleExport}>Export Excel</Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-accent flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>{editingPayroll ? 'Edit Payroll' : 'Add Payroll'}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPayroll ? 'Edit Payroll' : 'Add Payroll'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                  <div>
                    <Label>Employee</Label>
                    <Select value={payrollForm.employee_id || ''} onValueChange={(v) => {
                      const emp = employees.find(e => e.id === v);
                      const proj = projects.find(p => p.id === payrollForm.project_id);
                      const rate = proj?.trades?.find(t => t.name === emp?.role)?.rate || 0;
                      setPayrollForm(prev => recalcPayroll({...prev, employee_id: v, rate}));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Project</Label>
                    <Select value={payrollForm.project_id || ''} onValueChange={(v) => {
                      const proj = projects.find(p => p.id === v);
                      const emp = employees.find(e => e.id === payrollForm.employee_id);
                      const rate = proj?.trades?.find(t => t.name === emp?.role)?.rate || 0;
                      setPayrollForm(prev => recalcPayroll({...prev, project_id: v, rate}));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(pr => (
                          <SelectItem key={pr.id} value={pr.id}>{pr.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Month</Label>
                    <Input type="month" value={payrollForm.month} onChange={e => setPayrollForm(prev => recalcPayroll({...prev, month: e.target.value}))} required />
                  </div>

                  <div>
                    <Label>Hours Worked</Label>
                    <Input type="number" min={0} value={payrollForm.hours_worked} onChange={e => setPayrollForm(prev => recalcPayroll({...prev, hours_worked: Number(e.target.value)}))} required />
                  </div>

                  <div>
                    <Label>Rate</Label>
                    <Input type="number" min={0} value={payrollForm.rate} onChange={e => setPayrollForm(prev => recalcPayroll({...prev, rate: Number(e.target.value)}))} required />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={payrollForm.status} onValueChange={v => setPayrollForm(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" type="button" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                    <Button type="submit">{editingPayroll ? 'Update' : 'Add'}</Button>
                  </div>

                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={filters.project} onValueChange={v => setFilters(prev => ({ ...prev, project: v }))}>
            <SelectTrigger><SelectValue placeholder="Filter by Project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input type="month" value={filters.month} onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))} placeholder="Filter by Month" />

          <Select value={filters.status} onValueChange={v => setFilters(prev => ({ ...prev, status: v }))}>
            <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.nationality} onValueChange={v => setFilters(prev => ({ ...prev, nationality: v }))}>
            <SelectTrigger><SelectValue placeholder="Filter by Nationality" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Nationalities</SelectItem>
              {Array.from(new Set(employees.map(e => e.nationality))).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input placeholder="Search Name or ID" value={filters.search} onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))} />
        </div>

        {/* Payroll Table */}
        <DataTableAdvanced
          data={filteredData}
          columns={[
            { accessor: 'employee_name', header: 'Employee' },
            { accessor: 'employee_id', header: 'Employee ID' },
            { accessor: 'role', header: 'Role/Trade' },
            { accessor: 'rate', header: 'Rate' },
            { accessor: 'project_name', header: 'Project' },
            { accessor: 'month_joined', header: 'Month Joined' },
            { accessor: 'hours_worked', header: 'Hours Worked' },
            { accessor: 'salary', header: 'Salary' },
            { accessor: 'final_pay', header: 'Final Pay' },
            { accessor: 'status', header: 'Status' },
            { accessor: 'nationality', header: 'Nationality' },
          ]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={false}
          emptyMessage="No payroll records found."
        />

      </motion.div>
    </div>
  );
}

