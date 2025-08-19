import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

// ================== EMPLOYEES ==================
export function useEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("*");
    if (!error && data) setEmployees(data);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const addEmployee = async (employee: any) => {
    const { data, error } = await supabase.from("employees").insert(employee).select();
    if (!error && data) setEmployees([...employees, ...data]);
  };

  const updateEmployee = async (id: number, updates: any) => {
    const { data, error } = await supabase.from("employees").update(updates).eq("id", id).select();
    if (!error && data) {
      setEmployees(employees.map((emp) => (emp.id === id ? data[0] : emp)));
    }
  };

  const deleteEmployee = async (id: number) => {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (!error) {
      setEmployees(employees.filter((emp) => emp.id !== id));
    }
  };

  // ✅ Import Employees (Excel, CSV, PDF)
  const importEmployees = async (file: File) => {
    if (file.name.endsWith(".pdf")) {
      const pdfData = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      let textContent = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        textContent += content.items.map((item: any) => item.str).join(" ") + "\n";
      }

      const lines = textContent.split("\n").map((line) => line.trim()).filter(Boolean);
      for (const line of lines) {
        const [Name, Position, Nationality, Iqama, Phone] = line.split(",");
        if (!Name) continue;
        await supabase.from("employees").insert({
          name: Name,
          position: Position,
          nationality: Nationality,
          iqama_number: Iqama,
          phone_number: Phone,
        });
      }
    } else {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      for (const row of rows as any[]) {
        await supabase.from("employees").insert({
          name: row.Name,
          position: row.Position,
          nationality: row.Nationality,
          iqama_number: row.Iqama,
          phone_number: row.Phone,
        });
      }
    }

    await fetchEmployees();
  };

  // ✅ Export Employees (Excel)
  const exportEmployees = () => {
    const worksheet = XLSX.utils.json_to_sheet(employees);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, "employees.xlsx");
  };

  return {
    employees,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    importEmployees,
    exportEmployees,
  };
}

// ================== PROJECTS ==================
export function useProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const fetchProjects = async () => {
    const { data, error } = await supabase.from("projects").select("*");
    if (!error && data) setProjects(data);
  };
  useEffect(() => {
    fetchProjects();
  }, []);
  return { projects, fetchProjects };
}

// ================== ADVANCES ==================
export function useAdvances() {
  const [advances, setAdvances] = useState<any[]>([]);

  const fetchAdvances = async () => {
    const { data, error } = await supabase.from("advances").select("*");
    if (!error && data) setAdvances(data);
  };

  useEffect(() => {
    fetchAdvances();
  }, []);

  const addAdvance = async (advance: any) => {
    const { data, error } = await supabase.from("advances").insert(advance).select();
    if (!error && data) setAdvances([...advances, ...data]);
  };

  const deleteAdvance = async (id: number) => {
    const { error } = await supabase.from("advances").delete().eq("id", id);
    if (!error) setAdvances(advances.filter((a) => a.id !== id));
  };

  const totalAdvanceFor = (employeeId: number) => {
    return advances
      .filter((a) => a.employee_id === employeeId)
      .reduce((sum, a) => sum + a.amount, 0);
  };

  return { advances, fetchAdvances, addAdvance, deleteAdvance, totalAdvanceFor };
}

// ================== PAYROLL ==================
export function usePayrolls() {
  const [payrolls, setPayrolls] = useState<any[]>([]);

  const fetchPayrolls = async () => {
    const { data, error } = await supabase.from("payrolls").select("*");
    if (!error && data) setPayrolls(data);
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const addPayroll = async (payroll: any) => {
    const { data, error } = await supabase.from("payrolls").insert(payroll).select();
    if (!error && data) setPayrolls([...payrolls, ...data]);
  };

  const updatePayroll = async (id: number, updates: any) => {
    const { data, error } = await supabase.from("payrolls").update(updates).eq("id", id).select();
    if (!error && data) {
      setPayrolls(payrolls.map((p) => (p.id === id ? data[0] : p)));
    }
  };

  const deletePayroll = async (id: number) => {
    const { error } = await supabase.from("payrolls").delete().eq("id", id);
    if (!error) setPayrolls(payrolls.filter((p) => p.id !== id));
  };

  return { payrolls, fetchPayrolls, addPayroll, updatePayroll, deletePayroll };
}

