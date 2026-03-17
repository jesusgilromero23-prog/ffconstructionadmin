import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Returns { canEdit, isLoading }
 * canEdit = true if user is admin OR has an approved SolicitudAcceso
 */
export function useEditPermission() {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const { data: solicitudes = [], isLoading: loadingSolicitudes } = useQuery({
    queryKey: ["misSolicitudes", user?.email],
    queryFn: () => base44.entities.SolicitudAcceso.filter({ usuario_email: user.email }),
    enabled: !!user?.email && user?.role !== "admin",
    staleTime: 30000,
  });

  const isLoading = loadingUser || loadingSolicitudes;

  if (!user) return { canEdit: false, isLoading, user: null };
  if (user.role === "admin") return { canEdit: true, isLoading: false, user };

  const aprobada = solicitudes.some(s => s.estado === "aprobado");
  return { canEdit: aprobada, isLoading, user };
}