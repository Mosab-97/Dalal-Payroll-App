'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Building2, DollarSign, Users, Trash2, Edit } from 'lucide-react';
import { useProjects } from '@/hooks/use-data';
import { formatCurrency } from '@/lib/utils';
import type { Project } from '@/lib/supabase';

export default function ProjectsPage() {
  const { projects, loading, addProject, updateProject, deleteProject } = useProjects();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [projectForm, setProjectForm] = useState({
    name: '',
    budget: 0,
    status: 'Active' as 'Active' | 'On Hold' | 'Completed',
    role_rates: {} as Record<string, number>,
  });

  const [roleRate, setRoleRate] = useState({ role: '', rate: 0 });

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectForm);
        setIsEditDialogOpen(false);
        toast.success('Project updated successfully');
      } else {
        await addProject(projectForm);
        setIsAddDialogOpen(false);
        toast.success('Project created successfully');
      }
      resetForm();
    } catch {
      toast.error('Error saving project');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      budget: project.budget,
      status: project.status as 'Active' | 'On Hold' | 'Completed',
      role_rates: project.role_rates || {},
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (project: Project) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteProject(project.id);
      toast.success('Project deleted successfully');
    }
  };

  const addRoleRate = () => {
    if (roleRate.role && roleRate.rate > 0) {
      setProjectForm(prev => ({
        ...prev,
        role_rates: { ...prev.role_rates, [roleRate.role]: roleRate.rate }
      }));
      setRoleRate({ role: '', rate: 0 });
    }
  };

  const removeRoleRate = (role: string) => {
    setProjectForm(prev => {
      const newRoleRates = { ...prev.role_rates };
      delete newRoleRates[role];
      return { ...prev, role_rates: newRoleRates };
    });
  };

  const resetForm = () => {
    setProjectForm({ name: '', budget: 0, status: 'Active', role_rates: {} });
    setEditingProject(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'On Hold': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'Completed': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tesla-emerald"></div>
    </div>
  );

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2"/> Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create New Project</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" value={projectForm.name} onChange={e => setProjectForm(prev => ({ ...prev, name: e.target.value }))} required/>
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input type="number" id="budget" value={projectForm.budget} onChange={e => setProjectForm(prev => ({ ...prev, budget: Number(e.target.value) }))} required/>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={projectForm.status} onValueChange={v => setProjectForm(prev => ({ ...prev, status: v as any }))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Role Rates</Label>
                <div className="flex space-x-2">
                  <Input placeholder="Role" value={roleRate.role} onChange={e => setRoleRate(prev => ({ ...prev, role: e.target.value }))}/>
                  <Input placeholder="Rate" type="number" value={roleRate.rate || ''} onChange={e => setRoleRate(prev => ({ ...prev, rate: Number(e.target.value) }))}/>
                  <Button type="button" onClick={addRoleRate}>Add</Button>
                </div>
                {Object.entries(projectForm.role_rates).map(([role, rate]) => (
                  <div key={role} className="flex justify-between p-2 bg-gray-100 rounded">
                    <span>{role}: {formatCurrency(rate)}</span>
                    <Button type="button" onClick={() => removeRoleRate(role)}><Trash2/></Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Input placeholder="Search projects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-4"/>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map(project => (
          <Card key={project.id} className="border p-4">
            <CardHeader className="flex justify-between items-start">
              <CardTitle>{project.name}</CardTitle>
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between"><span>Budget:</span> <span>{formatCurrency(project.budget)}</span></div>
              {Object.keys(project.role_rates).length > 0 && (
                <div className="mt-2">
                  <span>Role Rates:</span>
                  {Object.entries(project.role_rates).map(([role, rate]) => (
                    <div key={role} className="flex justify-between">{role}: {formatCurrency(rate)}</div>
                  ))}
                </div>
              )}
              <div className="flex space-x-2 mt-2">
                <Button onClick={() => handleEdit(project)}><Edit/></Button>
                <Button onClick={() => handleDelete(project)}><Trash2/></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredProjects.length === 0 && (
          <div className="text-center p-8">
            <Building2 className="mx-auto h-12 w-12"/>
            <p>No projects found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

