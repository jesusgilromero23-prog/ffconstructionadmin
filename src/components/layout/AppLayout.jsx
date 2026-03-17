import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatBubble from "@/components/dashboard/ChatBubble";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function AppLayout() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <footer className="px-6 py-3 border-t border-border bg-card/50 flex items-center justify-center">
          <p className="text-[11px] text-muted-foreground text-center">
            Diseñado y desarrollado por{" "}
            <span className="font-semibold text-foreground">Jesús Gil</span>
            {" "}— ContaControl © {new Date().getFullYear()}
          </p>
        </footer>
      </main>
      <ChatBubble user={user} />
    </div>
  );
}