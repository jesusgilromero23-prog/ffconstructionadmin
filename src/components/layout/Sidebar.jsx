import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Receipt, FileCheck, FolderKanban, CreditCard, 
  BarChart3, Menu, X, ChevronRight, LogOut, ArrowDownCircle, Building2, Shield
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  { label: "Dashboard", path: "/Dashboard", icon: LayoutDashboard },
  { label: "Depósitos", path: "/Depositos", icon: ArrowDownCircle },
  { label: "Gastos Generales", path: "/Gastos", icon: Receipt },
  { label: "Control de Cheques", path: "/Cheques", icon: FileCheck },
  { label: "Tarjetas de Crédito", path: "/Tarjetas", icon: CreditCard },
  { label: "Proyectos", path: "/Proyectos", icon: Building2 },
  { label: "Gastos x Proyecto", path: "/GastosProyecto", icon: FolderKanban },
  { label: "Reportes", path: "/Reportes", icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const NavContent = () => (
    <div className="flex flex-col h-full">
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

      <nav className="flex-1 px-3 space-y-0.5 mt-1 overflow-y-auto">
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

      <div className="px-3 pb-4 mt-auto pt-2 border-t border-sidebar-border">
        {user?.role === "admin" && (
          <Link
            to="/AdminPanel"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1 ${
              location.pathname === "/AdminPanel"
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Shield className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>Panel Admin</span>}
          </Link>
        )}
        <button 
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors mt-2"
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card shadow-lg border border-border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

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

      <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
        <NavContent />
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors z-10"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </aside>
    </>
  );
}