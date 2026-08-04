import {
  Brain, Inbox, LayoutTemplate, Megaphone, Mic, Presentation,
  Target, UserRoundCog, CalendarDays, type LucideIcon,
} from "lucide-react";

/**
 * Registro de módulos.
 *
 * Construir por módulo significa: agregar una entrada acá y sus rutas.
 * El shell dibuja la navegación desde esta lista; los módulos `enabled: false`
 * aparecen en gris con la nota de "por construir", para que el esqueleto muestre
 * el mapa completo desde el día uno sin fingir que ya existe.
 */
export type ModuleDef = {
  id: string;
  label: string;
  note: string;
  path: string;
  icon: LucideIcon;
  group: "entrada" | "conocimiento" | "produccion" | "salida";
  enabled: boolean;
};

export const MODULES: ModuleDef[] = [
  { id: "ingesta",   label: "Ingesta",   note: "Archivos, URLs, video",   path: "/ingesta",   icon: Inbox,          group: "entrada",       enabled: false },
  { id: "marca",     label: "Marca",     note: "29 herramientas",         path: "/marca",     icon: UserRoundCog,   group: "entrada",       enabled: false },
  { id: "campus",    label: "Campus",    note: "Conocimiento ajeno",      path: "/campus",    icon: LayoutTemplate, group: "conocimiento",  enabled: false },
  { id: "cerebro",   label: "Cerebro",   note: "Conocimiento propio",     path: "/cerebro",   icon: Brain,          group: "conocimiento",  enabled: false },
  { id: "frentes",   label: "Frentes",   note: "PR y targets",            path: "/frentes",   icon: Target,         group: "produccion",    enabled: false },
  { id: "anuncios",  label: "Anuncios",  note: "Campañas",                path: "/anuncios",  icon: Megaphone,      group: "produccion",    enabled: false },
  { id: "voz",       label: "Voz",       note: "Charlas",                 path: "/voz",       icon: Mic,            group: "produccion",    enabled: false },
  { id: "decks",     label: "Decks",     note: "Presentaciones",          path: "/decks",     icon: Presentation,   group: "produccion",    enabled: true  },
  { id: "editorial", label: "Editorial", note: "Calendario y métricas",   path: "/editorial", icon: CalendarDays,   group: "salida",        enabled: false },
];

export const GROUP_LABEL: Record<ModuleDef["group"], string> = {
  entrada: "Entrada",
  conocimiento: "Conocimiento",
  produccion: "Producción",
  salida: "Salida",
};

export const enabledModules = () => MODULES.filter((m) => m.enabled);
