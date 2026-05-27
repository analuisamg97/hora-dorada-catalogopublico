export const mockProps = [
  { id: "p1", name: "Silla de terciopelo oliva", code: "HD-CH-014", category: "Sillas", style: "Vintage", state: "Disponible", price: 850, photo: "", art: "chair", colors: ["#d8c4a0", "#5c6b4b"] },
  { id: "p2", name: "Lámpara latón curvo", code: "HD-LA-028", category: "Iluminación", style: "Art déco", state: "Disponible", price: 620, photo: "", art: "lamp", colors: ["#ead8a8", "#bd8d35"] },
  { id: "p3", name: "Jarrón cerámico miel", code: "HD-VA-007", category: "Decoración", style: "Orgánico", state: "En showroom", price: 380, photo: "", art: "vase", colors: ["#ecd9c8", "#ad593b"] },
  { id: "p4", name: "Espejo oval antiguo", code: "HD-MI-018", category: "Espejos", style: "Clásico", state: "Disponible", price: 900, photo: "", art: "mirror", colors: ["#e7d5bd", "#a47a31"] },
  { id: "p5", name: "Pedestal mármol crema", code: "HD-PE-011", category: "Pedestales", style: "Editorial", state: "Disponible con detalle", price: 760, photo: "", art: "pedestal", colors: ["#efe4d2", "#b7aa99"] },
  { id: "p6", name: "Baúl madera envejecida", code: "HD-TR-003", category: "Mobiliario", style: "Rústico", state: "Disponible", price: 540, photo: "", art: "trunk", colors: ["#e6cfb0", "#774b35"] },
  { id: "p7", name: "Biombo lino natural", code: "HD-BI-006", category: "Fondos", style: "Minimal", state: "En showroom", price: 1200, photo: "", art: "screen", colors: ["#f0dfc4", "#93836f"] },
  { id: "p8", name: "Mesa lateral nogal", code: "HD-TA-021", category: "Mesas", style: "Mid-century", state: "Disponible", price: 680, photo: "", art: "table", colors: ["#e9cfac", "#68452e"] },
  { id: "p9", name: "Marco dorado barroco", code: "HD-FR-012", category: "Decoración", style: "Clásico", state: "Disponible", price: 450, photo: "", art: "frame", colors: ["#edd89c", "#bd8d35"] },
  { id: "p10", name: "Sillón bouclé marfil", code: "HD-CH-032", category: "Sillas", style: "Editorial", state: "Disponible", price: 1350, photo: "", art: "chair", colors: ["#f1e5d0", "#c7b9a4"] },
  { id: "p11", name: "Candelabro de bronce", code: "HD-CA-009", category: "Decoración", style: "Art déco", state: "Disponible con detalle", price: 320, photo: "", art: "lamp", colors: ["#ead6a6", "#8b6d2f"] },
  { id: "p12", name: "Banco tapizado terracota", code: "HD-BE-005", category: "Mobiliario", style: "Vintage", state: "Disponible", price: 780, photo: "", art: "bench", colors: ["#efd1bc", "#ad593b"] }
];

export const mockRentals = [
  { id: "r1", propIds: ["p2", "p5"], start: "2026-06-06", end: "2026-06-08", status: "Confirmada" },
  { id: "r2", propIds: ["p8"], start: "2026-06-10", end: "2026-06-13", status: "Confirmada" },
  { id: "r3", propIds: ["p10"], start: "2026-06-14", end: "2026-06-15", status: "Confirmada" }
];
