export function filterCatalogItems(items, filters, allowedStates) {
  const search = filters.search.trim().toLowerCase();

  return items
    .filter((item) => allowedStates.includes(item.state))
    .filter((item) => {
      if (!search) return true;
      return [item.name, item.code, item.category, item.style]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    })
    .filter((item) => filters.category === "Todas" || item.category === filters.category)
    .filter((item) => filters.style === "Todos" || item.style === filters.style)
    .filter((item) => filters.state === "Todos" || item.state === filters.state)
    .filter((item) => {
      if (filters.price === "Hasta $500") return item.price <= 500;
      if (filters.price === "$501 - $900") return item.price > 500 && item.price <= 900;
      if (filters.price === "Más de $900") return item.price > 900;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "Precio menor") return a.price - b.price;
      if (filters.sort === "Precio mayor") return b.price - a.price;
      if (filters.sort === "Nombre A-Z") return a.name.localeCompare(b.name);
      return a.code.localeCompare(b.code);
    });
}

export function getUniqueOptions(items, key, fallback) {
  const options = [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
  return [fallback, ...options];
}
