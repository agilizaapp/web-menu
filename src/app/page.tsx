"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminApp } from "@/components/AdminApp";
import { toast } from "sonner";

export default function AdminPartnerPage() {
  const params = useParams();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const urlId = params.id as string;

  const validClientId = process.env.NEXT_PUBLIC_FORGOTTEN_ID;

  useEffect(() => {
    if (!validClientId) {
      toast.error("Configuração inválida do sistema");
      setIsValidating(false);
      return;
    }

    if (!urlId) {
      toast.error("Acesso negado: ID inválido");
      setIsValidating(false);
      return;
    }

    // if (urlId !== validClientId) {
    //   toast.error("Acesso negado: Credenciais inválidas");
    //   setIsValidating(false);

    //   setTimeout(() => {
    //     router.push("/");
    //   }, 2000);
    //   return;
    // }

    setIsAuthorized(true);
    setIsValidating(false);
  }, [urlId, validClientId, router]);

  // if (isValidating) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-background">
  //       <div className="text-center space-y-4">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
  //         <p className="text-muted-foreground">Validando credenciais...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!isAuthorized) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-background">
  //       <div className="text-center space-y-4">
  //         <div className="text-6xl mb-4">🔒</div>
  //         <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
  //         <p className="text-muted-foreground">
  //           Você não tem permissão para acessar esta página.
  //         </p>
  //         <p className="text-sm text-muted-foreground">
  //           Redirecionando para a página inicial...
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return <AdminApp />;
}
