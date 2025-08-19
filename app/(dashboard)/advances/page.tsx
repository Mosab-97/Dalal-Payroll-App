'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DataTableAdvanced } from '@/components/ui/data-table-advanced';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useEmployees, useAdvances, usePayrolls } from '@/hooks/use-data';
import type { Advance, Employee } from '@/lib/supabase';

export default function AdvancePage() {
  const { employees } = useEmployees();
  const { advances, addAdvance, updateAdvance, deleteAdvance, totalAdvanceFor } = useAdvances();
  const { payrolls, updatePayroll } = usePayrolls();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<Advance | null>(null);
  const [advanceForm, setAdvanceForm] = useState({
    employee_id: '',
    amount: '',
    note: '',
    date: '',
  });

  const resetForm = () => {
    setAdvanceForm({ employee_id: '', amount: '', note: '', date: '' });
    setEditingAdvance(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceForm.employee_id || !advanceForm.amount) {
      toast.error('Employee and amount are required');
      return;
    }

    try {
      const advData = {
        employee_id: advanceForm.employee_id,
        amount: Number(advanceForm.amount),
        note: advanceForm.note,
        date: advanceForm.date || new Date().toISOString(),
      };

      if (editingAdvance) {
        await updateAdvance(editingAdvance.id, advData);
        toast.success('Advance updated successfully');
      } else {
        await addAdvance(advData);
        toast.success('Advance added successfully');
      }

      // Automatically update payroll net pay
      const payroll = payrolls.find(p => p.employee_id === advData.employee_id);
      if (payroll) {
        const totalAdvance = totalAdvanceFor(advData.employee_id);
        await updatePayroll(payroll.id, { net_pay: payroll.gross_pay - totalAdvance });
      }

      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Error saving advance');
    }
  };

  const handleEdit = (adv: Advance) => {
    setEditingAdvance(adv);
    setAdvanceForm({
      employee_id: adv.employee_id,
      amount: String(adv.amount),
      note: adv.note || '',
      date: adv.date || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (adv: Advance) => {
    if (window.confirm('Are you sure you want to delete this advance?')) {
      try {
        await deleteAdvance(adv.id);
        toast.success('Advance deleted successfully');

        // Update payroll net pay after deleting advance
        const payroll = payrolls.find(p => p.employee_id === adv.employee_id);
        if (payroll) {
          const totalAdvance = totalAdvanceFor(adv.employee_id);
          await updatePayroll(payroll.id, { net_pay: payroll.gross_pay - totalAdvance });
        }
      } catch (error) {
        console.error(error);
        toast.error('Error deleting advance');
      }
    }
  };

  const columns = [
    {
      accessor: 'employee_id',
      header: 'Employee',
      cell: ({ row }: any) => {
        const emp: Employee | undefined = employees.find(e => e.id === row.employee_id);
        return emp ? emp.name : 'Unknown';
      },
    },
    { accessor: 'amount', header: 'Amount' },
    { accessor: 'note', header: 'Note' },
    { accessor: 'date', header: 'Date', cell: ({ row }: any) => row.date ? new Date(row.date).toLocaleDateString() : '' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-tesla-white via-tesla-gray/10 to-tesla-white p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-tesla-charcoal tracking-tight">Advances</h1>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent rounded-xl flex items-center space-x-2">
                <Plus className="h-4 w-4" /> <span>{editingAdvance ? 'Edit Advance' : 'Add Advance'}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingAdvance ? 'Edit Advance' : 'Add New Advance'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select value={advanceForm.employee_id} onValueChange={v => setAdvanceForm(prev => ({ ...prev, employee_id: v }))} required>
                  <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Amount" type="number" value={advanceForm.amount} onChange={e => setAdvanceForm(prev => ({ ...prev, amount: e.target.value }))} required />
                <Input placeholder="Note (optional)" value={advanceForm.note} onChange={e => setAdvanceForm(prev => ({ ...prev, note: e.target.value }))} />
                <Input type="date" placeholder="Date" value={advanceForm.date} onChange={e => setAdvanceForm(prev => ({ ...prev, date: e.target.value }))} />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit">{editingAdvance ? 'Update' : 'Add'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTableAdvanced
          data={advances}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={false}
          emptyMessage="No advances found."
        />
      </motion.div>
    </div>
  );
}

