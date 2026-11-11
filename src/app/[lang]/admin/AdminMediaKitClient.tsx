"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Sparkles, Download, Share2 } from "lucide-react";

interface AdminMediaKitClientProps {
  stats: {
    totalUsers: number;
    newUsersWeek: number;
    newUsersMonth: number;
    totalUnlocks: number;
    totalRatings: number;
    totalReviews: number;
    totalSponsors: number;
    totalGamesPlayed: number;
    topProvinces: { name: string; count: number; pct: number }[];
    topAges: { range: string; count: number; pct: number }[];
    topScreens: { path: string; label: string; count: number; pct: number }[];
  };
}

export default function AdminMediaKitClient({ stats }: AdminMediaKitClientProps) {
  const [copied, setCopied] = useState(false);

  const generateMediaKitText = () => {
    const dateStr = new Date().toLocaleDateString("es-CR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const topProvinceStr = stats.topProvinces.slice(0, 3).map((p) => `${p.name} (${p.pct}%)`).join(", ");
    const topAgeStr = stats.topAges.slice(0, 2).map((a) => `${a.range} años (${a.pct}%)`).join(", ");
    const topScreensStr = stats.topScreens.slice(0, 3).map((s, i) => `${i + 1}. ${s.label}`).join("\n");

    return `📊 COLECTIKOS | MEDIA KIT & MÉTRICAS OFICIALES
Actualizado al: ${dateStr}

👥 AUDIENCIA Y ALCANCE
• Exploradores Registrados: ${stats.totalUsers.toLocaleString("es-CR")}
• Nuevos Usuarios (Últimos 30 días): +${stats.newUsersMonth.toLocaleString("es-CR")}
• Nuevos Usuarios (Últimos 7 días): +${stats.newUsersWeek.toLocaleString("es-CR")}
• Núcleo Demográfico: ${topProvinceStr || "San José, Alajuela, Heredia"}
• Rango de Edad Predominante: ${topAgeStr || "26-35 años, 18-25 años"}

⭐ ENGAGEMENT Y CONTENIDO TURÍSTICO
• Postales y Destinos Desbloqueados: ${stats.totalUnlocks.toLocaleString("es-CR")}
• Calificaciones Comunitarias (Huellas): ${stats.totalRatings.toLocaleString("es-CR")}
• Reseñas y Experiencias Escritas: ${stats.totalReviews.toLocaleString("es-CR")}
• Partidas de Juegos y Retención: ${stats.totalGamesPlayed.toLocaleString("es-CR")} interacciones

📱 PANTALLAS DE MAYOR EXPOSICIÓN
${topScreensStr || "1. Álbum y Destinos de Costa Rica\n2. Muro Comunitario de Exploradores\n3. Tiko Playa y Minijuegos"}

🤝 ALIANZAS Y COMERCIOS (B2B)
• Patrocinadores y Comercios en Ruta: ${stats.totalSponsors}

Sitio oficial: https://colectikos.com`;
  };

  const handleCopy = () => {
    const text = generateMediaKitText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("¡Resumen de Media Kit copiado al portapapeles!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs md:text-sm shadow-md transition-all active:scale-95"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        <span>{copied ? "¡Copiado!" : "Copiar Ficha para Media Kit"}</span>
      </button>
    </div>
  );
}
