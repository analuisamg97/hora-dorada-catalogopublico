export const defaultConfig = {
  dataMode: "mock",
  baseId: "",
  token: "",
  allowedStates: ["Disponible", "Disponible con detalle", "En showroom"],
  tables: {
    inventory: "INVENTARIO",
    rentals: "RENTAS",
    requests: "SOLICITUDES"
  },
  fields: {
    inventory: {
      name: "Nombre del prop",
      code: "Código único",
      state: "Estado",
      category: "Categoría",
      style: "Estilo",
      price: "Renta x 1 día",
      photo: "Foto principal"
    },
    rentals: {
      status: "Estado",
      start: "Fecha de salida",
      end: "Fecha de regreso",
      props: "Props"
    },
    requests: {
      clientName: "Nombre del cliente",
      whatsapp: "WhatsApp",
      notes: "Notas",
      start: "Fecha de salida",
      end: "Fecha de regreso",
      days: "Días cobrados",
      props: "Props solicitados",
      subtotal: "Subtotal",
      iva: "IVA",
      total: "Total estimado",
      deposit: "Anticipo sugerido",
      status: "Estado"
    }
  }
};

const storageKey = "horaDoradaClientConfig";

export function loadConfig() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return structuredClone(defaultConfig);

  try {
    return mergeConfig(defaultConfig, JSON.parse(saved));
  } catch {
    return structuredClone(defaultConfig);
  }
}

export function saveConfig(config) {
  localStorage.setItem(storageKey, JSON.stringify(config));
}

export function resetConfig() {
  localStorage.removeItem(storageKey);
}

function mergeConfig(base, saved) {
  return {
    ...structuredClone(base),
    ...saved,
    tables: { ...base.tables, ...(saved.tables || {}) },
    fields: {
      inventory: { ...base.fields.inventory, ...(saved.fields?.inventory || {}) },
      rentals: { ...base.fields.rentals, ...(saved.fields?.rentals || {}) },
      requests: { ...base.fields.requests, ...(saved.fields?.requests || {}) }
    }
  };
}
