import { loadAirtableData, createQuoteRequest } from "./airtable.js";
import { filterCatalogItems, getUniqueOptions } from "./catalog.js";
import { loadConfig, resetConfig, saveConfig } from "./config.js";
import { formatCompactMoney, formatDate, formatMoney } from "./formatters.js";
import { mockProps, mockRentals } from "./mock-data.js";
import { calculateQuote, getUnavailableMessage, isPropUnavailable } from "./quote.js";

const state = {
  config: loadConfig(),
  props: [],
  rentals: [],
  selectedIds: ["p1", "p2", "p5"],
  filters: {
    search: "",
    category: "Todas",
    style: "Todos",
    state: "Todos",
    price: "Todos",
    sort: "Destacados"
  },
  startDate: "2026-06-06",
  endDate: "2026-06-08",
  viewMode: "grid"
};

const els = {
  sourceDot: document.querySelector("#sourceDot"),
  sourceLabel: document.querySelector("#sourceLabel"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  settingsForm: document.querySelector("#settingsForm"),
  dataMode: document.querySelector("#dataMode"),
  airtableBaseId: document.querySelector("#airtableBaseId"),
  airtableToken: document.querySelector("#airtableToken"),
  allowedStates: document.querySelector("#allowedStates"),
  inventoryTable: document.querySelector("#inventoryTable"),
  rentalsTable: document.querySelector("#rentalsTable"),
  requestsTable: document.querySelector("#requestsTable"),
  useMockData: document.querySelector("#useMockData"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  styleFilter: document.querySelector("#styleFilter"),
  stateFilter: document.querySelector("#stateFilter"),
  priceFilter: document.querySelector("#priceFilter"),
  sortFilter: document.querySelector("#sortFilter"),
  gridViewButton: document.querySelector("#gridViewButton"),
  listViewButton: document.querySelector("#listViewButton"),
  quoteHeaderCount: document.querySelector("#quoteHeaderCount"),
  headerQuoteButton: document.querySelector("#headerQuoteButton"),
  loadingState: document.querySelector("#loadingState"),
  catalogGrid: document.querySelector("#catalogGrid"),
  catalogCount: document.querySelector("#catalogCount"),
  quotePanel: document.querySelector("#quotePanel"),
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
  daysPill: document.querySelector("#daysPill"),
  cartList: document.querySelector("#cartList"),
  availabilityAlert: document.querySelector("#availabilityAlert"),
  subtotal: document.querySelector("#subtotal"),
  iva: document.querySelector("#iva"),
  total: document.querySelector("#total"),
  deposit: document.querySelector("#deposit"),
  reviewQuote: document.querySelector("#reviewQuote"),
  mobileSelected: document.querySelector("#mobileSelected"),
  mobileTotal: document.querySelector("#mobileTotal"),
  openCart: document.querySelector("#openCart"),
  quoteDialog: document.querySelector("#quoteDialog"),
  reviewStart: document.querySelector("#reviewStart"),
  reviewEnd: document.querySelector("#reviewEnd"),
  reviewDays: document.querySelector("#reviewDays"),
  reviewItems: document.querySelector("#reviewItems"),
  reviewSubtotal: document.querySelector("#reviewSubtotal"),
  reviewIva: document.querySelector("#reviewIva"),
  reviewTotal: document.querySelector("#reviewTotal"),
  reviewDeposit: document.querySelector("#reviewDeposit"),
  chargedDaysLabel: document.querySelector("#chargedDaysLabel"),
  requestForm: document.querySelector("#requestForm"),
  clientName: document.querySelector("#clientName"),
  clientWhatsapp: document.querySelector("#clientWhatsapp"),
  clientNotes: document.querySelector("#clientNotes"),
  requestStatus: document.querySelector("#requestStatus"),
  shareWhatsApp: document.querySelector("#shareWhatsApp"),
  successDialog: document.querySelector("#successDialog"),
  successWhatsApp: document.querySelector("#successWhatsApp"),
  downloadPdf: document.querySelector("#downloadPdf")
};

init();

async function init() {
  bindEvents();
  fillSettingsForm();
  setDefaultDates();
  await loadData();
}

function bindEvents() {
  els.settingsButton.addEventListener("click", () => els.settingsDialog.showModal());
  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  els.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.config = readSettingsForm();
    saveConfig(state.config);
    els.settingsDialog.close();
    await loadData();
  });

  els.useMockData.addEventListener("click", async () => {
    resetConfig();
    state.config = loadConfig();
    fillSettingsForm();
    els.settingsDialog.close();
    await loadData();
  });

  els.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value;
    renderCatalog();
  });

  els.gridViewButton.addEventListener("click", () => setViewMode("grid"));
  els.listViewButton.addEventListener("click", () => setViewMode("list"));

  document.querySelector("#clearFilters")?.addEventListener("click", () => {
    state.filters = {
      search: "",
      category: "Todas",
      style: "Todos",
      state: "Todos",
      price: "Todos",
      sort: "Destacados"
    };
    els.searchInput.value = "";
    populateFilters();
    renderCatalog();
  });

  [
    [els.categoryFilter, "category"],
    [els.styleFilter, "style"],
    [els.stateFilter, "state"],
    [els.priceFilter, "price"],
    [els.sortFilter, "sort"]
  ].forEach(([select, key]) => {
    select.addEventListener("change", (event) => {
      state.filters[key] = event.target.value;
      renderCatalog();
    });
  });

  els.startDate.addEventListener("change", (event) => {
    state.startDate = event.target.value;
    if (state.endDate < state.startDate) {
      state.endDate = state.startDate;
      els.endDate.value = state.endDate;
    }
    renderCart();
  });

  els.endDate.addEventListener("change", (event) => {
    state.endDate = event.target.value < state.startDate ? state.startDate : event.target.value;
    els.endDate.value = state.endDate;
    renderCart();
  });

  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    const remove = event.target.closest("[data-remove]");

    if (add) {
      toggleSelected(add.dataset.add);
    }

    if (remove) {
      state.selectedIds = state.selectedIds.filter((id) => id !== remove.dataset.remove);
      renderAll();
    }
  });

  els.openCart.addEventListener("click", () => {
    els.quotePanel.classList.toggle("quote--mobile-open");
  });

  els.headerQuoteButton.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      els.quotePanel.classList.toggle("quote--mobile-open");
      return;
    }
    els.quotePanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.reviewQuote.addEventListener("click", () => {
    renderReview();
    els.quotePanel.classList.remove("quote--mobile-open");
    els.quoteDialog.showModal();
  });

  els.requestForm.addEventListener("submit", submitRequest);
  els.shareWhatsApp.addEventListener("click", shareWhatsApp);
  els.successWhatsApp.addEventListener("click", shareWhatsApp);
  els.downloadPdf.addEventListener("click", () => window.print());
  lockCartScroll();
}

async function loadData() {
  setLoading(true);

  try {
    if (state.config.dataMode === "airtable") {
      const data = await loadAirtableData(state.config);
      state.props = data.props;
      state.rentals = data.rentals;
      state.selectedIds = state.selectedIds.filter((id) => state.props.some((prop) => prop.id === id));
      setSource("Airtable conectado", true);
    } else {
      state.props = mockProps;
      state.rentals = mockRentals;
      state.selectedIds = ["p1", "p2", "p5"];
      setSource("Datos de prueba", false);
    }

    populateFilters();
    renderAll();
  } catch (error) {
    state.props = mockProps;
    state.rentals = mockRentals;
    setSource("Error Airtable, usando prueba", false);
    populateFilters();
    renderAll();
    showStatus(getFriendlyRequestError(error), "error");
  } finally {
    setLoading(false);
  }
}

function setDefaultDates() {
  els.startDate.value = state.startDate;
  els.endDate.value = state.endDate;
}

function setSource(label, connected) {
  els.sourceLabel.textContent = label;
  els.sourceDot.classList.toggle("source-dot--connected", connected);
}

function setLoading(isLoading) {
  els.loadingState.hidden = !isLoading;
  els.catalogGrid.hidden = isLoading;
}

function populateFilters() {
  const publicItems = state.props.filter((prop) => state.config.allowedStates.includes(prop.state));
  setSelectOptions(els.categoryFilter, getUniqueOptions(publicItems, "category", "Todas"), state.filters.category);
  setSelectOptions(els.styleFilter, getUniqueOptions(publicItems, "style", "Todos"), state.filters.style);
  setSelectOptions(els.stateFilter, ["Todos", ...state.config.allowedStates], state.filters.state);
  setSelectOptions(els.priceFilter, ["Todos", "Hasta $500", "$501 - $900", "Más de $900"], state.filters.price);
  setSelectOptions(els.sortFilter, ["Destacados", "Precio menor", "Precio mayor", "Nombre A-Z"], state.filters.sort);
}

function setSelectOptions(select, options, value) {
  select.innerHTML = options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("");
  select.value = options.includes(value) ? value : options[0];
}

function renderAll() {
  renderCatalog();
  renderCart();
}

function renderCatalog() {
  const items = filterCatalogItems(state.props, state.filters, state.config.allowedStates);
  applyViewMode();
  els.catalogCount.textContent = `${items.length} ${items.length === 1 ? "prop disponible" : "props disponibles"}`;

  if (!items.length) {
    els.catalogGrid.innerHTML = `<div class="empty-state empty-state--wide">No encontramos props con esos filtros.</div>`;
    return;
  }

  els.catalogGrid.innerHTML = items.map((prop) => {
    const selected = state.selectedIds.includes(prop.id);
    return `
      <article class="prop-card">
        <div class="prop-card__photo" style="--photo-a: ${prop.colors?.[0] || "#ead8bd"}; --photo-b: ${prop.colors?.[1] || "#bd8d35"}">
          ${renderPhoto(prop)}
        </div>
        <div class="prop-card__body">
          <div class="prop-card__meta">
            <span>${escapeHtml(prop.code)}</span>
            <span>${escapeHtml(prop.category || "Sin categoría")}</span>
          </div>
          <h3>${escapeHtml(prop.name)}</h3>
          <div class="prop-card__foot">
            <div class="price">${formatCompactMoney(prop.price)}<span>por día</span></div>
            <button class="add-button ${selected ? "add-button--selected" : ""}" type="button" data-add="${escapeHtml(prop.id)}" aria-label="${selected ? "Quitar" : "Agregar"} ${escapeHtml(prop.name)}">
              ${selected ? "✓" : "+"}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function setViewMode(mode) {
  state.viewMode = mode;
  applyViewMode();
}

function applyViewMode() {
  const isList = state.viewMode === "list";
  els.catalogGrid.classList.toggle("catalog-grid--list", isList);
  els.gridViewButton.classList.toggle("view-toggle__button--active", !isList);
  els.listViewButton.classList.toggle("view-toggle__button--active", isList);
  els.gridViewButton.setAttribute("aria-pressed", String(!isList));
  els.listViewButton.setAttribute("aria-pressed", String(isList));
}

function renderCart() {
  const quote = getQuote();
  els.daysPill.textContent = `${quote.days} ${quote.days === 1 ? "día" : "días"}`;
  els.chargedDaysLabel.textContent = `${quote.days} ${quote.days === 1 ? "día" : "días"}`;
  els.reviewQuote.disabled = quote.available.length === 0;

  if (!quote.selected.length) {
    els.cartList.innerHTML = `<div class="empty-state">Agrega props para armar tu cotización.</div>`;
  } else {
    els.cartList.innerHTML = quote.selected.map((prop) => {
      const unavailable = isPropUnavailable(prop.id, state.rentals, state.startDate, state.endDate);
      const dailyPrice = formatCompactMoney(prop.price);
      const itemSubtotal = unavailable ? "$0 incluido" : `${formatCompactMoney(prop.price * quote.days)} MXN`;
      return `
        <div class="cart-item ${unavailable ? "cart-item--unavailable" : ""}">
          <div class="cart-item__thumb" style="--photo-a: ${prop.colors?.[0] || "#ead8bd"}; --photo-b: ${prop.colors?.[1] || "#bd8d35"}">${renderPhoto(prop)}</div>
          <div class="cart-item__copy">
            <strong>${escapeHtml(getCartDisplayName(prop.name))}</strong>
            <span>${escapeHtml(prop.code)}</span>
            ${unavailable ? `<em>Rentado en estas fechas</em>` : ""}
            <small><span>x 1</span><span>${dailyPrice} / día</span></small>
          </div>
          <div class="cart-item__price">
            <strong>${itemSubtotal}</strong>
            <button type="button" data-remove="${escapeHtml(prop.id)}" aria-label="Quitar ${escapeHtml(prop.name)}">×</button>
          </div>
        </div>
      `;
    }).join("");
  }

  if (quote.unavailable.length) {
    els.availabilityAlert.textContent = getUnavailableMessage(quote.unavailable.length);
    els.availabilityAlert.classList.add("availability-alert--show");
  } else {
    els.availabilityAlert.classList.remove("availability-alert--show");
  }

  updateTotals(quote, "");
  els.mobileSelected.textContent = `${quote.selected.length} ${quote.selected.length === 1 ? "prop seleccionado" : "props seleccionados"}`;
  els.mobileTotal.textContent = formatMoney(quote.total);
  els.quoteHeaderCount.textContent = quote.selected.length;
}

function renderReview() {
  const quote = getQuote();
  els.reviewStart.textContent = formatDate(state.startDate);
  els.reviewEnd.textContent = formatDate(state.endDate);
  els.reviewDays.textContent = `${quote.days} ${quote.days === 1 ? "día" : "días"}`;

  els.reviewItems.innerHTML = quote.available.map((prop) => `
    <div class="review-item">
      <div class="cart-item__thumb" style="--photo-a: ${prop.colors?.[0] || "#ead8bd"}; --photo-b: ${prop.colors?.[1] || "#bd8d35"}">${renderPhoto(prop)}</div>
      <div>
        <strong>${escapeHtml(prop.name)}</strong>
        <span>${escapeHtml(prop.code)} · ${formatCompactMoney(prop.price)} por día</span>
      </div>
      <strong>${formatCompactMoney(prop.price * quote.days)}</strong>
    </div>
  `).join("") || `<div class="empty-state">No hay props disponibles para cotizar en estas fechas.</div>`;

  updateTotals(quote, "review");
  els.requestStatus.textContent = "";
}

function updateTotals(quote, prefix) {
  const map = prefix ? {
    subtotal: els.reviewSubtotal,
    iva: els.reviewIva,
    total: els.reviewTotal,
    deposit: els.reviewDeposit
  } : {
    subtotal: els.subtotal,
    iva: els.iva,
    total: els.total,
    deposit: els.deposit
  };

  map.subtotal.textContent = formatMoney(quote.subtotal);
  map.iva.textContent = formatMoney(quote.iva);
  map.total.textContent = formatMoney(quote.total);
  map.deposit.textContent = formatMoney(quote.deposit);
}

async function submitRequest(event) {
  event.preventDefault();
  const quote = { ...getQuote(), startDate: state.startDate, endDate: state.endDate };
  const client = {
    name: els.clientName.value.trim(),
    whatsapp: els.clientWhatsapp.value.trim(),
    notes: els.clientNotes.value.trim()
  };

  if (!client.name || !client.whatsapp) {
    showStatus("Agrega nombre y WhatsApp para enviar la solicitud.", "error");
    return;
  }

  if (!quote.available.length) {
    showStatus("No hay props disponibles para enviar en esta cotización.", "error");
    return;
  }

  if (state.config.dataMode !== "airtable") {
    showSuccessScreen();
    return;
  }

  try {
    await createQuoteRequest(state.config, quote, client);
    showSuccessScreen();
  } catch (error) {
    showStatus(getFriendlyRequestError(error), "error");
  }
}

function showSuccessScreen() {
  els.quoteDialog.close();
  els.requestForm.reset();
  els.requestStatus.textContent = "";
  els.successDialog.showModal();
}

function lockCartScroll() {
  els.cartList.addEventListener("wheel", (event) => {
    const canScroll = els.cartList.scrollHeight > els.cartList.clientHeight;
    if (!canScroll) return;

    const atTop = els.cartList.scrollTop === 0;
    const atBottom = Math.ceil(els.cartList.scrollTop + els.cartList.clientHeight) >= els.cartList.scrollHeight;
    const scrollingUp = event.deltaY < 0;
    const scrollingDown = event.deltaY > 0;

    if ((scrollingUp && !atTop) || (scrollingDown && !atBottom)) {
      event.stopPropagation();
    }
  }, { passive: true });
}

function shareWhatsApp() {
  const quote = getQuote();
  const lines = [
    "Hola, quiero revisar esta cotización estimada de Hora Dorada Prop House:",
    `Fechas: ${formatDate(state.startDate)} a ${formatDate(state.endDate)}`,
    `Props: ${quote.available.map((prop) => prop.code).join(", ")}`,
    `Total estimado: ${formatMoney(quote.total)}`
  ];

  window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
}

function getFriendlyRequestError(error) {
  const message = String(error?.message || error || "");

  if (message.includes("403") || message.includes("INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND")) {
    return "No pude guardar la solicitud en Airtable. Revisa que exista la tabla SOLICITUDES y que tu token tenga permiso para crear registros en esa base.";
  }

  if (message.includes("422")) {
    return "Airtable no aceptó algún campo de la solicitud. Revisa que los campos de SOLICITUDES se llamen exactamente como están configurados.";
  }

  return "No pude enviar la solicitud. Revisa la configuración de Airtable e intenta de nuevo.";
}

function showStatus(message, type) {
  els.requestStatus.textContent = message;
  els.requestStatus.dataset.type = type;
}

function getQuote() {
  return calculateQuote({
    props: state.props,
    rentals: state.rentals,
    selectedIds: state.selectedIds,
    startDate: state.startDate,
    endDate: state.endDate
  });
}

function getCartDisplayName(name) {
  return String(name || "").split(" — ")[0].trim();
}

function toggleSelected(id) {
  state.selectedIds = state.selectedIds.includes(id)
    ? state.selectedIds.filter((selectedId) => selectedId !== id)
    : [...state.selectedIds, id];
  renderAll();
}

function fillSettingsForm() {
  els.dataMode.value = state.config.dataMode;
  els.airtableBaseId.value = state.config.baseId;
  els.airtableToken.value = state.config.token;
  els.allowedStates.value = state.config.allowedStates.join(", ");
  els.inventoryTable.value = state.config.tables.inventory;
  els.rentalsTable.value = state.config.tables.rentals;
  els.requestsTable.value = state.config.tables.requests;
}

function readSettingsForm() {
  return {
    ...state.config,
    dataMode: els.dataMode.value,
    baseId: els.airtableBaseId.value.trim(),
    token: els.airtableToken.value.trim(),
    allowedStates: els.allowedStates.value.split(",").map((item) => item.trim()).filter(Boolean),
    tables: {
      inventory: els.inventoryTable.value.trim() || "INVENTARIO",
      rentals: els.rentalsTable.value.trim() || "RENTAS",
      requests: els.requestsTable.value.trim() || "SOLICITUDES"
    }
  };
}

function renderPhoto(prop) {
  if (prop.photo) {
    return `<img src="${escapeAttribute(prop.photo)}" alt="${escapeAttribute(prop.name)}" loading="lazy" />`;
  }

  return renderPropArt(prop.art || "prop");
}

function renderPropArt(type) {
  const art = {
    chair: `<path d="M18 18h28v22H18z"></path><path d="M16 38h32v10H16z"></path><path d="M21 48v10M43 48v10"></path>`,
    lamp: `<path d="M24 18h16l8 18H16z"></path><path d="M32 36v18"></path><path d="M22 54h20v5H22z"></path>`,
    vase: `<path d="M26 18h12l-3 10c8 5 10 24-3 29-13-5-11-24-3-29z"></path><path d="M25 17h14v6H25z"></path>`,
    mirror: `<ellipse cx="32" cy="32" rx="16" ry="23"></ellipse><ellipse cx="32" cy="32" rx="10" ry="16"></ellipse>`,
    pedestal: `<path d="M22 17h20v8H22z"></path><path d="M26 25h12v25H26z"></path><path d="M18 50h28v8H18z"></path>`,
    trunk: `<path d="M16 28h32v24H16z"></path><path d="M20 21h24v9H20z"></path><path d="M16 38h32M27 28v24M37 28v24"></path>`,
    screen: `<path d="M13 16h13v42H13zM26 16h13v42H26zM39 16h13v42H39z"></path><path d="M26 18v38M39 18v38"></path>`,
    table: `<ellipse cx="32" cy="24" rx="20" ry="7"></ellipse><path d="M22 30v24M42 30v24"></path><path d="M18 52h28v5H18z"></path>`,
    frame: `<path d="M16 15h32v38H16z"></path><path d="M22 21h20v26H22z"></path>`,
    bench: `<path d="M14 29h36v15H14z"></path><path d="M20 44v12M44 44v12"></path>`,
    prop: `<path d="M18 20h28v34H18z"></path><path d="M24 14h16v10H24z"></path><path d="M24 30h16M24 38h16"></path>`
  };

  return `<svg class="prop-art" viewBox="0 0 64 64" aria-hidden="true">${art[type] || art.prop}</svg>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
