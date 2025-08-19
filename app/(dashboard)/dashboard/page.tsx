'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FolderOpen, 
  Calculator, 
  CreditCard, 
  Receipt, 
  TrendingUp,
  Clock,
  DollarSign,
  Building2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useProjects, useEmployees, usePayroll, useAdvances, useExpenses, useActivityLogs } from '@/hooks/use-data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { projects } = useProjects();
  const { employees } = useEmployees();
  const { payroll } = usePayroll();
  const { advances } = useAdvances();
  const { expenses } = useExpenses();
  const { logs } = useActivityLogs();

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate chart data for the last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7) + '-01';
      
      const monthPayroll = payroll
        .filter(p => p.month === monthStr)
        .reduce((sum, p) => sum + p.final_pay, 0);
      
      const monthAdvances = advances
        .filter(a => a.date.startsWith(monthStr.slice(0, 7)))
        .reduce((sum, a) => sum + a.amount, 0);

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        payroll: monthPayroll,
        advances: monthAdvances,
      });
    }
    setChartData(months);
  }, [payroll, advances]);

  // Calculate current month totals
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
  const currentMonthPayroll = payroll
    .filter(p => p.month === currentMonth)
    .reduce((sum, p) => sum + p.final_pay, 0);

  const totalAdvances = advances
    .filter(a => !a.paid)
    .reduce((sum, a) => sum + a.amount, 0);

  const currentMonthExpenses = expenses
    .filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, e) => sum + e.amount, 0);

  const activeProjects = projects.filter(p => p.status === 'Active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-tesla-white via-tesla-gray/10 to-tesla-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-tesla-charcoal tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground font-light">
            Financial overview and system activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Employees"
            value={employees.length}
            icon={Users}
            change={{ value: 8, type: 'increase' }}
            gradient="from-blue-500/20 to-blue-500/5"
          />
          <StatsCard
            title="Active Projects"
            value={activeProjects}
            icon={FolderOpen}
            change={{ value: 12, type: 'increase' }}
            gradient="from-emerald-500/20 to-emerald-500/5"
          />
          <StatsCard
            title="Current Month Payroll"
            value={formatCurrency(currentMonthPayroll)}
            icon={Calculator}
            change={{ value: 5, type: 'increase' }}
            gradient="from-purple-500/20 to-purple-500/5"
          />
          <StatsCard
            title="Pending Advances"
            value={formatCurrency(totalAdvances)}
            icon={CreditCard}
            change={{ value: 3, type: 'decrease' }}
            gradient="from-orange-500/20 to-orange-500/5"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payroll vs Advances Chart */}
          <Card className="lg:col-span-2 border-tesla-gray/20 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-tesla-charcoal">
                <TrendingUp className="h-5 w-5" />
                <span>Payroll vs Advances Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D9DBE1" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6B7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6B7280"
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), '']}
                      labelStyle={{ color: '#0B0B0C' }}
                      contentStyle={{ 
                        backgroundColor: '#F8F9FB', 
                        border: '1px solid #D9DBE1',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="payroll" 
                      stroke="#00B894" 
                      strokeWidth={3}
                      dot={{ fill: '#00B894', strokeWidth: 2, r: 4 }}
                      name="Payroll"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="advances" 
                      stroke="#0B0B0C" 
                      strokeWidth={3}
                      dot={{ fill: '#0B0B0C', strokeWidth: 2, r: 4 }}
                      name="Advances"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-tesla-gray/20 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-tesla-charcoal">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent activity</p>
              ) : (
                logs.slice(0, 8).map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-xl bg-white/70 border border-tesla-gray/10"
                  >
                    <div className="p-2 bg-tesla-emerald/10 rounded-xl">
                      {log.table_name === 'projects' && <Building2 className="h-4 w-4 text-tesla-emerald" />}
                      {log.table_name === 'employees' && <Users className="h-4 w-4 text-tesla-emerald" />}
                      {log.table_name === 'payroll' && <Calculator className="h-4 w-4 text-tesla-emerald" />}
                      {log.table_name === 'advances' && <CreditCard className="h-4 w-4 text-tesla-emerald" />}
                      {log.table_name === 'expenses' && <Receipt className="h-4 w-4 text-tesla-emerald" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-tesla-charcoal">
                        {log.action === 'INSERT' && 'Created'} new {log.table_name.slice(0, -1)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-tesla-emerald/10 text-tesla-emerald text-xs">
                      {log.action}
                    </Badge>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-tesla-gray/20 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                  <p className="text-xl font-bold text-tesla-charcoal">
                    {formatCurrency(currentMonthExpenses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-tesla-gray/20 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-xl font-bold text-tesla-charcoal">
                    {projects.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-tesla-gray/20 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/10 rounded-2xl">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payroll Records</p>
                  <p className="text-xl font-bold text-tesla-charcoal">
                    {payroll.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}