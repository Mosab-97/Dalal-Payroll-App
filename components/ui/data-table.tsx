'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface Column {
  header: string;
  accessor: string;
  cell?: (value: { getValue: () => any; row: any }) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
}

export function DataTable({ 
  data, 
  columns, 
  loading = false, 
  emptyMessage = "No data available",
  onRowClick
}: DataTableProps) {
  if (loading) {
    return (
      <Card className="p-6 rounded-2xl border-tesla-gray/30">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-tesla-gray/20 rounded-xl animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="p-12 rounded-2xl border-tesla-gray/30 text-center">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-tesla-gray/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-tesla-gray/10 hover:bg-tesla-gray/20 border-tesla-gray/30">
            {columns.map((column, index) => (
              <TableHead key={index} className="font-semibold text-tesla-charcoal">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <motion.tr
              key={rowIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
              className={`border-tesla-gray/20 hover:bg-tesla-gray/5 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className="py-4">
                  {column.cell 
                    ? column.cell({ getValue: () => row[column.accessor], row })
                    : row[column.accessor]
                  }
                </TableCell>
              ))}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}