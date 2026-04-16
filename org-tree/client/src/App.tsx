import { useState, useEffect, useCallback } from 'react';
import { TreePine, LogIn, LogOut, Settings, UserPlus, PanelLeftClose, PanelLeft, Menu, X, FolderPlus } from 'lucide-react';
import { OrgTree } from './components/OrgTree';
import { Sidebar } from './components/Sidebar';
import { EmployeeModal } from './components/EmployeeModal';
import { LoginForm } from './components/LoginForm';
import { AdminPanel } from './components/AdminPanel';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { api } from './services/api';
import type { Employee, User } from './types';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [customDepartmentMode, setCustomDepartmentMode] = useState(false);
  const [deptFilter, setDeptFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (e) {
      console.error('Failed to load employees:', e);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
    checkAuth();
  }, [loadEmployees, checkAuth]);

  const handleNodeClick = useCallback((emp: Employee) => {
    setSelectedEmployee(emp);
    setHighlightedId(emp.id);
  }, []);

  const handleSidebarSelect = useCallback((id: number) => {
    setHighlightedId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) setSelectedEmployee(emp);
    if (isMobile) setSidebarOpen(false);
  }, [employees, isMobile]);

  const handleNavigate = useCallback((id: number) => {
    setHighlightedId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) setSelectedEmployee(emp);
  }, [employees]);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 md:px-4 py-2 md:py-2.5 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <TreePine size={20} className="text-blue-600 md:w-[22px] md:h-[22px]" />
            <h1 className="text-base md:text-lg font-bold text-gray-900">OrgTree</h1>
            <span className="text-sm text-gray-400 hidden sm:inline">Организационная структура</span>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {user && user.role === 'ADMIN' && (
            <>
              <button
                onClick={() => { setCustomDepartmentMode(false); setShowAddEmployee(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                <UserPlus size={14} /> Добавить
              </button>
              <button
                onClick={() => { setCustomDepartmentMode(true); setShowAddEmployee(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
              >
                <FolderPlus size={14} /> Направление
              </button>
              <button
                onClick={() => setShowAdmin(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                <Settings size={14} /> Админ
              </button>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {user.name}
                <span className="text-xs text-gray-400 ml-1">
                  ({user.role === 'ADMIN' ? 'Админ' : user.role === 'EDITOR' ? 'Редактор' : 'Просмотр'})
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                title="Выйти"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <LogIn size={14} /> Войти
            </button>
          )}
        </div>

        {/* Mobile burger */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <span className="text-xs text-gray-500 truncate max-w-[80px]">{user.name}</span>
          ) : null}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-md z-20 px-4 py-3 space-y-2">
          {user && user.role === 'ADMIN' && (
            <>
              <button
                onClick={() => { setCustomDepartmentMode(false); setShowAddEmployee(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                <UserPlus size={16} /> Добавить сотрудника
              </button>
              <button
                onClick={() => { setCustomDepartmentMode(true); setShowAddEmployee(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
              >
                <FolderPlus size={16} /> Добавить направление
              </button>
              <button
                onClick={() => { setShowAdmin(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                <Settings size={16} /> Админ-панель
              </button>
            </>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
            >
              <LogOut size={16} /> Выйти ({user.role === 'ADMIN' ? 'Админ' : user.role === 'EDITOR' ? 'Редактор' : 'Просмотр'})
            </button>
          ) : (
            <button
              onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <LogIn size={16} /> Войти
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black/40 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {sidebarOpen && (
          <div className={isMobile ? 'fixed inset-y-0 left-0 z-40 w-full max-w-[300px]' : ''}>
            <Sidebar
              employees={employees}
              onSelect={handleSidebarSelect}
              onFilter={setDeptFilter}
              activeFilter={deptFilter}
              onClose={isMobile ? () => setSidebarOpen(false) : undefined}
            />
          </div>
        )}

        <div className="flex-1">
          <OrgTree
            employees={employees}
            highlightedId={highlightedId}
            onNodeClick={handleNodeClick}
            deptFilter={deptFilter}
          />
        </div>
      </div>

      {/* Modals */}
      {selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          allEmployees={employees}
          user={user}
          onClose={() => {
            setSelectedEmployee(null);
            setHighlightedId(null);
          }}
          onUpdate={() => {
            loadEmployees();
            api.getEmployee(selectedEmployee.id).then(setSelectedEmployee).catch(() => setSelectedEmployee(null));
          }}
          onNavigate={handleNavigate}
        />
      )}

      {showLogin && (
        <LoginForm
          onLogin={(u) => {
            setUser(u);
            setShowLogin(false);
          }}
          onClose={() => setShowLogin(false)}
        />
      )}

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {showAddEmployee && (
        <AddEmployeeModal
          allEmployees={employees}
          onClose={() => setShowAddEmployee(false)}
          onCreated={loadEmployees}
          customDepartmentMode={customDepartmentMode}
        />
      )}
    </div>
  );
}
