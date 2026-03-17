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
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <ChatBubble user={user} />
    </div>
  );
}