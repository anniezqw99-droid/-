/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Calculator, 
  Plus, 
  Trash2, 
  Download, 
  TrendingUp, 
  DollarSign,
  Calendar,
  LayoutDashboard,
  Briefcase,
  ShieldCheck,
  FileText,
  PieChart,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Fallback for non-secure contexts or older browsers
  }
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

// --- Types ---

interface Employee {
  id: string;
  name: string;
  baseSalary: number;
  includedKM: number;
  type: 'performance' | 'fixed';
}

interface PerformanceTier {
  id: string;
  minKM: number;
  maxKM: number | null; // null means infinity
  rate: number;
}

interface MonthlyRecord {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  totalKM: number;
}

// --- Constants & Defaults ---

const DEFAULT_TIERS: PerformanceTier[] = [
  { id: '1', minKM: 0, maxKM: 500, rate: 1.0 },
  { id: '2', minKM: 500, maxKM: 1000, rate: 1.5 },
  { id: '3', minKM: 1000, maxKM: null, rate: 2.0 },
];

const STORAGE_KEY = 'salary_calc_data_v2';

// --- Business UI Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden", className)}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "",
  disabled = false
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'business',
  className?: string,
  disabled?: boolean
}) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'bg-transparent text-slate-400 hover:bg-slate-50',
    business: 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  placeholder = "",
  icon: Icon
}: { 
  label?: string, 
  value: string | number, 
  onChange: (val: string) => void,
  type?: string,
  placeholder?: string,
  icon?: any
}) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    const stringValue = value === null || value === undefined ? '' : value.toString();
    if (type === 'number') {
      // Only sync if the numeric value actually changed
      // This allows users to type "0." or clear the input without immediate snapping
      const currentNum = parseFloat(localValue);
      const nextNum = parseFloat(stringValue);
      if (currentNum !== nextNum && !(isNaN(currentNum) && nextNum === 0)) {
        setLocalValue(stringValue);
      }
    } else if (localValue !== stringValue) {
      setLocalValue(stringValue);
    }
  }, [value, type]);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />}
        <input 
          type={type}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className={cn(
            "w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-300 font-medium",
            Icon ? "pl-10 pr-4" : "px-4"
          )}
        />
      </div>
    </div>
  );
};

const InlineNumericInput = ({ 
  value, 
  onChange, 
  placeholder = "0" 
}: { 
  value: number, 
  onChange: (val: number) => void,
  placeholder?: string
}) => {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toString());

  useEffect(() => {
    const currentNum = parseFloat(localValue);
    if (currentNum !== value && !(isNaN(currentNum) && value === 0)) {
      setLocalValue(value === 0 ? '' : value.toString());
    }
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <input 
        type="number"
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange(parseFloat(e.target.value) || 0);
        }}
        placeholder={placeholder}
        className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:outline-none transition-all text-sm font-bold text-slate-700"
      />
      <span className="text-[10px] font-bold text-slate-300">KM</span>
    </div>
  );
};

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tiers, setTiers] = useState<PerformanceTier[]>(DEFAULT_TIERS);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState<'calc' | 'employees' | 'tiers'>('calc');

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEmployees(parsed.employees || []);
        setTiers(parsed.tiers || DEFAULT_TIERS);
        setRecords(parsed.records || []);
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ employees, tiers, records }));
  }, [employees, tiers, records]);

  // --- Logic ---

  const calculatePerformancePay = (excessKM: number) => {
    if (excessKM <= 0) return 0;
    
    let totalPay = 0;
    const sortedTiers = [...tiers].sort((a, b) => a.minKM - b.minKM);
    
    for (const tier of sortedTiers) {
      const min = tier.minKM;
      const max = tier.maxKM === null ? Infinity : tier.maxKM;
      
      if (excessKM > min) {
        const kmInThisTier = Math.min(excessKM, max) - min;
        totalPay += kmInThisTier * tier.rate;
      }
    }
    
    return totalPay;
  };

  const getSalaryData = (employee: Employee) => {
    if (employee.type === 'fixed') {
      return {
        totalKM: 0,
        excessKM: 0,
        performancePay: 0,
        totalSalary: employee.baseSalary
      };
    }
    const record = records.find(r => r.employeeId === employee.id && r.month === currentMonth);
    const totalKM = record ? record.totalKM : 0;
    const excessKM = Math.max(0, totalKM - employee.includedKM);
    const performancePay = calculatePerformancePay(excessKM);
    const totalSalary = employee.baseSalary + performancePay;
    
    return {
      totalKM,
      excessKM,
      performancePay,
      totalSalary
    };
  };

  // --- Export Functionality ---

  const exportToCSV = () => {
    try {
      if (employees.length === 0) {
        alert("暂无员工数据可供导出。");
        return;
      }

      const headers = ["员工姓名", "员工类型", "底薪", "包含公里", "本月总公里", "超出公里", "绩效工资", "应发工资"];
      const rows = employees.map(emp => {
        const data = getSalaryData(emp);
        // 确保数据安全，处理可能存在的逗号
        const safeName = `"${emp.name.replace(/"/g, '""')}"`;
        const typeName = emp.type === 'fixed' ? '固定薪资' : '绩效薪资';
        return [
          safeName,
          typeName,
          emp.baseSalary,
          emp.includedKM,
          data.totalKM,
          data.excessKM.toFixed(2),
          data.performancePay.toFixed(2),
          data.totalSalary.toFixed(2)
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      // 使用 BOM 确保 Excel 正确识别 UTF-8 编码中的中文字符
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      // 兼容性处理
      link.href = url;
      link.setAttribute("download", `薪资报表_${currentMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("导出失败:", error);
      alert("导出失败，请检查数据是否完整。");
    }
  };

  // --- Handlers ---

  const addEmployee = () => {
    const newEmp: Employee = {
      id: generateId(),
      name: '新员工',
      baseSalary: 3000,
      includedKM: 2000,
      type: 'performance'
    };
    setEmployees([...employees, newEmp]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEmployee = (id: string) => {
    if (confirm('确定要删除该员工信息吗？')) {
      setEmployees(employees.filter(e => e.id !== id));
      setRecords(records.filter(r => r.employeeId !== id));
    }
  };

  const updateRecord = (employeeId: string, totalKM: number) => {
    const existingIndex = records.findIndex(r => r.employeeId === employeeId && r.month === currentMonth);
    if (existingIndex >= 0) {
      const newRecords = [...records];
      newRecords[existingIndex] = { ...newRecords[existingIndex], totalKM };
      setRecords(newRecords);
    } else {
      setRecords([...records, {
        id: generateId(),
        employeeId,
        month: currentMonth,
        totalKM
      }]);
    }
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newTier: PerformanceTier = {
      id: generateId(),
      minKM: lastTier ? (lastTier.maxKM || lastTier.minKM + 500) : 0,
      maxKM: null,
      rate: lastTier ? lastTier.rate + 0.5 : 1.0
    };
    
    if (lastTier && lastTier.maxKM === null) {
      const updatedTiers = tiers.map(t => t.id === lastTier.id ? { ...t, maxKM: newTier.minKM } : t);
      setTiers([...updatedTiers, newTier]);
    } else {
      setTiers([...tiers, newTier]);
    }
  };

  const deleteTier = (id: string) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter(t => t.id !== id));
  };

  const updateTier = (id: string, updates: Partial<PerformanceTier>) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // --- Render Sections ---

  const renderCalc = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider">薪资结算中心</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">月度薪资报表</h2>
          <p className="text-slate-500">录入本月公里数，系统将自动核算薪资详情</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="month" 
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="bg-transparent focus:outline-none font-semibold text-slate-700 text-sm"
            />
          </div>
          <Button variant="business" onClick={exportToCSV}>
            <Download className="w-4 h-4" />
            导出报表
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">员工姓名</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">薪资构成</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">本月里程</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">超出部分</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">绩效提成</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">应发总额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Briefcase className="w-10 h-10 text-slate-200" />
                      <p className="text-slate-400 font-medium">暂无员工数据，请先前往“员工管理”添加</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map(emp => {
                  const data = getSalaryData(emp);
                  const isFixed = emp.type === 'fixed';
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                            isFixed ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-600"
                          )}>
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-700">{emp.name}</div>
                            <div className="text-[10px] font-medium text-slate-400">
                              {isFixed ? '固定薪资' : '绩效薪资'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-semibold text-slate-600">¥{emp.baseSalary.toLocaleString()}</div>
                        {!isFixed && <div className="text-[10px] font-medium text-slate-400">含 {emp.includedKM} KM</div>}
                        {isFixed && <div className="text-[10px] font-medium text-slate-400">全额固定</div>}
                      </td>
                      <td className="px-6 py-5">
                        {!isFixed ? (
                          <InlineNumericInput 
                            value={data.totalKM}
                            onChange={(val) => updateRecord(emp.id, val)}
                          />
                        ) : (
                          <span className="text-xs text-slate-300 italic">不涉及里程</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {!isFixed ? (
                          <span className={cn(
                            "text-xs font-bold px-2.5 py-1 rounded-md",
                            data.excessKM > 0 ? 'bg-emerald-50 text-emerald-600' : 'text-slate-300'
                          )}>
                            {data.excessKM.toFixed(1)} KM
                          </span>
                        ) : (
                          <span className="text-slate-200">-</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {!isFixed ? (
                          <span className={cn(
                            "text-sm font-bold",
                            data.performancePay > 0 ? 'text-indigo-600' : 'text-slate-300'
                          )}>
                            ¥{data.performancePay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-200">-</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-xl font-bold text-slate-900">
                          ¥{data.totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col gap-2 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">员工总数</span>
            <Users className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{employees.length}</div>
        </Card>
        <Card className="p-6 flex flex-col gap-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">绩效总额</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            ¥{employees.reduce((acc, emp) => acc + getSalaryData(emp).performancePay, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card className="p-6 flex flex-col gap-2 border-l-4 border-l-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">薪资总支出</span>
            <DollarSign className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            ¥{employees.reduce((acc, emp) => acc + getSalaryData(emp).totalSalary, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <Users className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider">人力资源管理</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">员工档案</h2>
          <p className="text-slate-500">管理员工基本信息及薪资核算基准</p>
        </div>
        <Button onClick={addEmployee}>
          <Plus className="w-4 h-4" />
          添加员工
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {employees.map(emp => (
            <motion.div
              key={emp.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              <Card className="p-6 space-y-5 relative group">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <Button variant="danger" onClick={() => deleteEmployee(emp.id)} className="p-2 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">员工类型</label>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <button 
                        onClick={() => updateEmployee(emp.id, { type: 'performance' })}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                          emp.type === 'performance' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        绩效薪资
                      </button>
                      <button 
                        onClick={() => updateEmployee(emp.id, { type: 'fixed' })}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                          emp.type === 'fixed' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        固定薪资
                      </button>
                    </div>
                  </div>

                  <Input 
                    label="员工姓名" 
                    value={emp.name} 
                    onChange={(val) => updateEmployee(emp.id, { name: val })} 
                    icon={FileText}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label={emp.type === 'fixed' ? "固定月薪" : "有责底薪"} 
                      type="number"
                      value={emp.baseSalary} 
                      onChange={(val) => updateEmployee(emp.id, { baseSalary: parseFloat(val) || 0 })} 
                      icon={DollarSign}
                    />
                    {emp.type === 'performance' && (
                      <Input 
                        label="包含公里" 
                        type="number"
                        value={emp.includedKM} 
                        onChange={(val) => updateEmployee(emp.id, { includedKM: parseFloat(val) || 0 })} 
                        icon={TrendingUp}
                      />
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderTiers = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <Settings className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider">核算标准配置</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">绩效阶梯设置</h2>
          <p className="text-slate-500">定义超出公里数后的阶梯提成单价</p>
        </div>
        <Button onClick={addTier}>
          <Plus className="w-4 h-4" />
          添加阶梯
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {tiers.sort((a, b) => a.minKM - b.minKM).map((tier, index) => (
            <div key={tier.id} className="flex flex-col md:flex-row items-end gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <Input 
                  label="起始里程 (KM)" 
                  type="number"
                  value={tier.minKM} 
                  onChange={(val) => updateTier(tier.id, { minKM: parseFloat(val) || 0 })} 
                  icon={TrendingUp}
                />
                <Input 
                  label="截止里程 (KM)" 
                  type="text"
                  placeholder="无上限"
                  value={tier.maxKM === null ? '' : tier.maxKM} 
                  onChange={(val) => updateTier(tier.id, { maxKM: val === '' ? null : parseFloat(val) })} 
                  icon={PieChart}
                />
                <Input 
                  label="提成单价 (¥/KM)" 
                  type="number"
                  value={tier.rate} 
                  onChange={(val) => updateTier(tier.id, { rate: parseFloat(val) || 0 })} 
                  icon={DollarSign}
                />
              </div>
              <Button variant="danger" onClick={() => deleteTier(tier.id)} className="p-2.5 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          ))}
          
          <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 flex gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-sm text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-900 mb-1">计算逻辑说明：</p>
              <p>系统采用分段累进算法。例如超出 1200 KM，阶梯为 0-500 (1元), 500-1000 (1.5元), 1000+ (2元)，计算方式为：</p>
              <div className="mt-2 font-mono font-bold text-indigo-600 bg-white px-3 py-2 rounded-lg border border-indigo-100 inline-block">
                500×1 + 500×1.5 + 200×2 = 1650元
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 bottom-0 w-20 md:w-64 bg-white border-r border-slate-200 z-50 flex flex-col">
        <div className="p-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Calculator className="w-6 h-6" />
            </div>
            <div className="hidden md:block">
              <span className="font-bold text-lg text-slate-900 tracking-tight block">薪资管理系统</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Edition</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 px-3 space-y-1">
          <button 
            onClick={() => setActiveTab('calc')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
              activeTab === 'calc' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            )}
          >
            <Calculator className="w-5 h-5" />
            <span className="hidden md:block">工资结算</span>
            <ChevronRight className={cn("w-4 h-4 ml-auto hidden md:block transition-transform", activeTab === 'calc' ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0')} />
          </button>
          <button 
            onClick={() => setActiveTab('employees')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
              activeTab === 'employees' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            )}
          >
            <Users className="w-5 h-5" />
            <span className="hidden md:block">员工管理</span>
            <ChevronRight className={cn("w-4 h-4 ml-auto hidden md:block transition-transform", activeTab === 'employees' ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0')} />
          </button>
          <button 
            onClick={() => setActiveTab('tiers')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
              activeTab === 'tiers' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="hidden md:block">阶梯设置</span>
            <ChevronRight className={cn("w-4 h-4 ml-auto hidden md:block transition-transform", activeTab === 'tiers' ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0')} />
          </button>
        </div>
        
        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-slate-400" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-bold text-slate-700">管理员</div>
              <div className="text-[10px] font-medium text-slate-400">财务专用</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-6 md:p-10">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'calc' && renderCalc()}
            {activeTab === 'employees' && renderEmployees()}
            {activeTab === 'tiers' && renderTiers()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
