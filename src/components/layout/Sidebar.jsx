import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Receipt, FileCheck, FolderKanban, CreditCard, 
  BarChart3, Menu, X, ChevronRight, LogOut
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Dashboard", path: "/Dashboard", icon: LayoutDashboard },
  { label: "Gastos Generales", path: "/Gastos", icon: Receipt },
  { label: "Control de Cheques", path: "/Cheques", icon: FileCheck },
  { label: "Gastos por Proyecto", path: "/Proyectos", icon: FolderKanban },
  { label: "Tarjetas de Crédito", path: "/Tarjetas", icon: CreditCard },
  { label: "Reportes", path: "/Reportes", icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">ContaControl</h1>
            <p className="text-[10px] text-sidebar-foreground/50">Coordinación Contable</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }
              `}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 mt-auto">
        <button 
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card shadow-lg border border-border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar z-50 shadow-2xl"
          >
            <NavContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
        <NavContent />
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </aside>
    </>
  );
}