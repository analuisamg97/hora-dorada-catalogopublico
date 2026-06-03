import { loadAirtableData, createQuoteRequest } from "./airtable.js";
import { filterCatalogItems, getUniqueOptions } from "./catalog.js";
import { loadConfig, resetConfig, saveConfig } from "./config.js";
import { formatCompactMoney, formatDate, formatMoney } from "./formatters.js";
import { mockProps, mockRentals } from "./mock-data.js";
import { calculateQuote, getUnavailableMessage, isPropUnavailable } from "./quote.js";

const cartStorageKey = "horaDoradaClientCart";
const datesStorageKey = "horaDoradaClientDates";
const moodboardStorageKey = "horaDoradaClientMoodboard";
const businessWhatsAppNumber = "528117160541";
const defaultSelectedIds = ["p1", "p2", "p5"];
const defaultDates = { startDate: "2026-06-06", endDate: "2026-06-08" };
const savedDates = loadSavedDates();
let quoteToastTimer = 0;

const state = {
  config: loadConfig(),
  props: [],
  rentals: [],
  selectedIds: loadSavedSelectedIds(defaultSelectedIds),
  moodboardIds: loadSavedMoodboardIds(),
  filters: {
    search: "",
    category: "Todas",
    style: "Todos",
    state: "Todos",
    price: "Todos",
    sort: "Destacados"
  },
  startDate: savedDates.startDate,
  endDate: savedDates.endDate,
  viewMode: "grid",
  activeProductId: "",
  activePage: "home"
};

const els = {
  sourceDot: document.querySelector("#sourceDot"),
  sourceLabel: document.querySelector("#sourceLabel"),
  pageViews: document.querySelectorAll("[data-page]"),
  navLinks: document.querySelectorAll("[data-nav-page]"),
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
  quoteHeaderCount: document.querySelector("#quoteHeaderCount"),
  headerQuoteButton: document.querySelector("#headerQuoteButton"),
  quoteCloseButton: document.querySelector("#quoteCloseButton"),
  quoteToast: document.querySelector("#quoteToast"),
  loadingState: document.querySelector("#loadingState"),
  catalogGrid: document.querySelector("#catalogGrid"),
  catalogCount: document.querySelector("#catalogCount"),
  moodboardCount: document.querySelector("#moodboardCount"),
  moodboardGrid: document.querySelector("#moodboardGrid"),
  moodboardList: document.querySelector("#moodboardList"),
  moodboardToQuote: document.querySelector("#moodboardToQuote"),
  productPage: document.querySelector("#productPage"),
  productDetail: document.querySelector("#productDetail"),
  productBack: document.querySelector("#productBack"),
  quotePanel: document.querySelector("#quotePanel"),
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
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
  contactLeadForm: document.querySelector("#contactLeadForm"),
  contactName: document.querySelector("#contactName"),
  contactWhatsapp: document.querySelector("#contactWhatsapp"),
  contactMessage: document.querySelector("#contactMessage"),
  contactStatus: document.querySelector("#contactStatus"),
  requestStatus: document.querySelector("#requestStatus"),
  shareWhatsApp: document.querySelector("#shareWhatsApp"),
  successDialog: document.querySelector("#successDialog"),
  successWhatsApp: document.querySelector("#successWhatsApp"),
  downloadPdf: document.querySelector("#downloadPdf")
};

init();

async function init() {
  bindEvents();
  setQuotePanelOpen(document.body.dataset.activePage === "catalogo");
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

  els.productBack.addEventListener("click", closeProductPage);
  window.addEventListener("hashchange", renderRoute);

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
    [els.categoryFilter, "category"]
  ].forEach(([select, key]) => {
    if (!select) return;
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
    saveDates();
    renderCart();
  });

  els.endDate.addEventListener("change", (event) => {
    state.endDate = event.target.value < state.startDate ? state.startDate : event.target.value;
    els.endDate.value = state.endDate;
    saveDates();
    renderCart();
  });

  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    const remove = event.target.closest("[data-remove]");
    const moodboard = event.target.closest("[data-moodboard]");
    const removeMoodboard = event.target.closest("[data-remove-moodboard]");
    const productCard = event.target.closest("[data-product-id]");

    if (add) {
      const wasSelected = state.selectedIds.includes(add.dataset.add);
      if (wasSelected) {
        removeSelected(add.dataset.add);
        showQuoteRemovalStatus(add.dataset.add);
      } else {
        setSelectedIds([...state.selectedIds, add.dataset.add]);
        if (!state.moodboardIds.includes(add.dataset.add)) {
          setMoodboardIds([...state.moodboardIds, add.dataset.add]);
        }
        showToast("Agregado a cotización y moodboard.", true);
      }
      return;
    }

    if (moodboard) {
      const wasSaved = state.moodboardIds.includes(moodboard.dataset.moodboard);
      toggleMoodboard(moodboard.dataset.moodboard);
      showMoodboardStatus(!wasSaved);
      return;
    }

    if (removeMoodboard) {
      removeMoodboardItem(removeMoodboard.dataset.removeMoodboard);
      showMoodboardStatus(false);
      return;
    }

    if (remove) {
      removeSelected(remove.dataset.remove);
      showQuoteRemovalStatus(remove.dataset.remove);
      return;
    }

    if (productCard) {
      openProductPage(productCard.dataset.productId);
    }
  });
  els.openCart.addEventListener("click", () => toggleQuotePanel());
  els.headerQuoteButton.addEventListener("click", () => toggleQuotePanel());
  els.quoteCloseButton.addEventListener("click", () => setQuotePanelOpen(false));

  els.reviewQuote.addEventListener("click", () => {
    renderReview();
    els.quotePanel.classList.remove("quote--mobile-open");
    els.quoteDialog.showModal();
  });

  els.requestForm.addEventListener("submit", submitRequest);
  els.contactLeadForm.addEventListener("submit", submitContactLead);
  els.shareWhatsApp.addEventListener("click", shareWhatsApp);
  els.successWhatsApp.addEventListener("click", shareWhatsApp);
  els.downloadPdf.addEventListener("click", () => window.print());
  els.moodboardToQuote?.addEventListener("click", sendMoodboardToQuote);
  lockCartScroll();
  bindCatalogWheelScroll();
  bindProductKeyboard();
}

async function loadData() {
  setLoading(true);

  try {
    if (state.config.dataMode === "airtable") {
      const data = await loadAirtableData(state.config);
      state.props = data.props;
      state.rentals = data.rentals;
      setSelectedIds(state.selectedIds.filter((id) => state.props.some((prop) => prop.id === id)), { render: false });
      setMoodboardIds(state.moodboardIds.filter((id) => state.props.some((prop) => prop.id === id)), { render: false });
      setSource("Airtable conectado", true);
    } else {
      state.props = mockProps;
      state.rentals = mockRentals;
      setSelectedIds(loadSavedSelectedIds(defaultSelectedIds), { render: false });
      setMoodboardIds(loadSavedMoodboardIds(), { render: false });
      setSource("Datos de prueba", false);
    }

    populateFilters();
    renderAll();
    renderRoute();
  } catch (error) {
    state.props = mockProps;
    state.rentals = mockRentals;
    setSource("Error Airtable, usando prueba", false);
    populateFilters();
    renderAll();
    renderRoute();
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
}

function setSelectOptions(select, options, value) {
  if (!select) return;
  select.innerHTML = options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("");
  select.value = options.includes(value) ? value : options[0];
}

function renderAll() {
  renderCatalog();
  renderCart();
  renderMoodboard();
}

function renderCatalog() {
  const items = filterCatalogItems(state.props, state.filters, state.config.allowedStates);
  state.viewMode = "grid";
  els.catalogGrid.classList.remove("catalog-grid--list");
  els.catalogCount.textContent = `${items.length} ${items.length === 1 ? "prop" : "props"}`;

  if (!items.length) {
    els.catalogGrid.innerHTML = `<div class="empty-state empty-state--wide">No encontramos props con esos filtros.</div>`;
    return;
  }

  els.catalogGrid.innerHTML = items.map((prop) => {
    const selected = state.selectedIds.includes(prop.id);
    const inMoodboard = state.moodboardIds.includes(prop.id);
    return `
      <article class="prop-card" data-product-id="${escapeHtml(prop.id)}" tabindex="0" role="button" aria-label="Ver detalle de ${escapeHtml(prop.name)}">
        <div class="prop-card__photo" style="--photo-a: ${prop.colors?.[0] || "#ead8bd"}; --photo-b: ${prop.colors?.[1] || "#bd8d35"}">
          ${renderPhoto(prop)}
        </div>
        <div class="prop-card__body">
          <h3>${escapeHtml(prop.name)}</h3>
          <div class="prop-card__meta">
            <span>${escapeHtml(prop.code)}</span>
            <span>${escapeHtml(prop.category || "Sin categoría")}</span>
          </div>
          <div class="prop-card__foot">
            <div class="price"><strong>${formatCompactMoney(prop.price)}</strong><span>MXN / día</span></div>
            <div class="prop-actions">
              <button class="moodboard-button ${inMoodboard ? "moodboard-button--selected" : ""}" type="button" data-moodboard="${escapeHtml(prop.id)}" aria-label="${inMoodboard ? "Quitar" : "Agregar"} ${escapeHtml(prop.name)} al moodboard">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16l-7-3.8L5 20V4Z"></path></svg>
              </button>
              <button class="add-button ${selected ? "add-button--selected" : ""}" type="button" data-add="${escapeHtml(prop.id)}" aria-label="${selected ? "Quitar" : "Agregar"} ${escapeHtml(prop.name)} a cotización">
                ${selected ? "✓" : "+"}
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderCart() {
  const quote = getQuote();
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
    els.availabilityAlert.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 22 20H2L12 3Z"></path>
        <path d="M12 9v5"></path>
        <path d="M12 17h.01"></path>
      </svg>
      <span>${escapeHtml(getUnavailableMessage())}</span>
    `;
    els.availabilityAlert.classList.add("availability-alert--show");
  } else {
    els.availabilityAlert.classList.remove("availability-alert--show");
  }

  updateTotals(quote, "");
  els.mobileSelected.textContent = `${quote.selected.length} ${quote.selected.length === 1 ? "prop seleccionado" : "props seleccionados"}`;
  els.mobileTotal.textContent = formatMoney(quote.total);
  els.quoteHeaderCount.textContent = quote.selected.length;
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function setQuotePanelOpen(isOpen) {
  if (isMobileViewport()) {
    els.quotePanel.classList.toggle("quote--mobile-open", isOpen);
  } else {
    document.body.classList.toggle("quote-panel-closed", !isOpen);
  }

  els.headerQuoteButton.setAttribute("aria-expanded", String(isOpen));
}

function toggleQuotePanel() {
  const isOpen = isMobileViewport()
    ? els.quotePanel.classList.contains("quote--mobile-open")
    : !document.body.classList.contains("quote-panel-closed");

  setQuotePanelOpen(!isOpen);
}

function renderRoute() {
  const hash = window.location.hash || "#home";
  const productId = decodeURIComponent(hash.replace("#producto/", ""));

  if (hash.startsWith("#producto/") && productId) {
    setActivePage("catalogo", { syncQuote: false });
    renderProductPage(productId);
    return;
  }

  closeProductPage({ updateHash: false });
  if (hash === "#contacto") {
    setActivePage("contacto");
    return;
  }

  if (hash === "#moodboard") {
    setActivePage("moodboard");
    return;
  }

  if (hash === "#catalogo") {
    setActivePage("catalogo");
    return;
  }

  setActivePage("home");
}

function setActivePage(page, options = {}) {
  state.activePage = page;
  document.body.dataset.activePage = page;
  els.pageViews.forEach((view) => {
    view.hidden = view.dataset.page !== page;
  });
  els.navLinks.forEach((link) => {
    link.classList.toggle("main-nav__link--active", link.dataset.navPage === page);
  });

  if (options.syncQuote === false) return;
  if (!isMobileViewport()) {
    setQuotePanelOpen(page === "catalogo");
  }
}

function openProductPage(id) {
  if (!id) return;
  window.location.hash = `producto/${encodeURIComponent(id)}`;
  renderProductPage(id);
}

function closeProductPage(options = {}) {
  state.activeProductId = "";
  els.productPage.hidden = true;
  document.body.classList.remove("product-route-active");

  if (options.updateHash !== false && window.location.hash.startsWith("#producto/")) {
    window.location.hash = "catalogo";
  }
}

function renderProductPage(id) {
  const prop = state.props.find((item) => item.id === id);
  if (!prop) {
    closeProductPage({ updateHash: false });
    return;
  }

  state.activeProductId = id;
  const selected = state.selectedIds.includes(prop.id);
  const inMoodboard = state.moodboardIds.includes(prop.id);
  const unavailable = isPropUnavailable(prop.id, state.rentals, state.startDate, state.endDate);
  const statusText = unavailable ? "Rentado en estas fechas" : prop.state;

  els.productDetail.innerHTML = `
    <div class="product-media">
      <div class="product-media__main" style="--photo-a: ${prop.colors?.[0] || "#ead8bd"}; --photo-b: ${prop.colors?.[1] || "#bd8d35"}">${renderPhoto(prop)}</div>
      <div class="product-media__thumbs" aria-label="Fotos del producto">
        <button class="product-media__thumb product-media__thumb--active" type="button" aria-label="Foto principal" style="--photo-a: ${prop.colors?.[0] || "#ead8bd"}; --photo-b: ${prop.colors?.[1] || "#bd8d35"}">${renderPhoto(prop)}</button>
      </div>
    </div>
    <article class="product-info">
      <p class="product-info__eyebrow">${escapeHtml(prop.category || "Prop")}</p>
      <h1>${escapeHtml(getCartDisplayName(prop.name))}</h1>
      <p class="product-info__sku">Código: ${escapeHtml(prop.code)}</p>
      <p class="product-info__price">${formatCompactMoney(prop.price)} <span>MXN / día</span></p>
      <div class="product-info__meta">
        <div><span>Estado</span><strong>${escapeHtml(statusText || "Por confirmar")}</strong></div>
        <div><span>Estilo</span><strong>${escapeHtml(prop.style || "Por definir")}</strong></div>
      </div>
      <div class="product-actions">
        <button class="product-moodboard ${inMoodboard ? "product-moodboard--selected" : ""}" type="button" data-moodboard="${escapeHtml(prop.id)}">
          ${inMoodboard ? "Quitar del moodboard" : "Agregar a moodboard"}
        </button>
        <button class="product-add ${selected ? "product-add--selected" : ""}" type="button" data-add="${escapeHtml(prop.id)}">
          ${selected ? "Quitar de la cotización" : "Agregar a cotización"}
        </button>
      </div>
      <div class="product-note">
        <button class="product-note__head" type="button" aria-expanded="true">
          IVA
          <span>−</span>
        </button>
        <p>Precio antes de IVA. El IVA se calcula automáticamente en la cotización final.</p>
      </div>
      <div class="product-note">
        <button class="product-note__head" type="button" aria-expanded="true">
          Disponibilidad
          <span>−</span>
        </button>
        <p>La renta queda sujeta a revisión de Hora Dorada. Los props no disponibles en tus fechas no se incluyen en la cotización final.</p>
      </div>
    </article>
  `;

  els.productPage.hidden = false;
  document.body.classList.add("product-route-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showProductSelectionStatus(isSelected) {
  showToast(
    isSelected ? "Producto agregado a tu cotización." : "Producto quitado de tu cotización.",
    isSelected
  );
}

function showQuoteRemovalStatus(id) {
  showToast(
    state.moodboardIds.includes(id)
      ? "Se eliminó de cotización. El prop sigue en tu moodboard."
      : "Producto quitado de tu cotización.",
    false
  );
}

function showMoodboardStatus(isSelected) {
  showToast(
    isSelected ? "Producto agregado al moodboard." : "Producto quitado del moodboard.",
    isSelected
  );
}

function showToast(message, isPositive) {
  if (!els.quoteToast) return;

  window.clearTimeout(quoteToastTimer);
  els.quoteToast.innerHTML = isPositive
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg><span>${escapeHtml(message)}</span>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"></path></svg><span>${escapeHtml(message)}</span>`;
  els.quoteToast.hidden = false;
  els.quoteToast.classList.add("quote-toast--show");
  quoteToastTimer = window.setTimeout(() => {
    els.quoteToast.classList.remove("quote-toast--show");
    els.quoteToast.hidden = true;
  }, 6000);
}

function renderMoodboard() {
  if (!els.moodboardGrid || !els.moodboardList) return;

  const props = getMoodboardProps();
  els.moodboardCount.textContent = `${props.length} ${props.length === 1 ? "prop" : "props"}`;
  els.moodboardToQuote.disabled = props.length === 0;
  els.moodboardGrid.classList.toggle("moodboard-grid--empty", props.length === 0);

  if (!props.length) {
    els.moodboardGrid.innerHTML = `
      <div class="moodboard-empty">
        <span>Moodboard vacío</span>
        <strong>Agrega props desde el catálogo para verlos juntos aquí.</strong>
        <a class="button button--secondary moodboard-link" href="#catalogo">Ir al catálogo</a>
      </div>
    `;
    els.moodboardList.innerHTML = `<div class="empty-state">Todavía no hay props guardados.</div>`;
    return;
  }

  els.moodboardGrid.innerHTML = props.map((prop, index) => `
    <article class="moodboard-tile moodboard-tile--${(index % 8) + 1}">
      <div class="moodboard-tile__photo" style="--photo-a: ${prop.colors?.[0] || "#ead8bd"}; --photo-b: ${prop.colors?.[1] || "#bd8d35"}">
        ${renderPhoto(prop)}
      </div>
      <div class="moodboard-tile__caption">
        <span>
          <strong>${escapeHtml(getCartDisplayName(prop.name))}</strong>
          <em>${escapeHtml(prop.style || prop.category || "Prop")}</em>
        </span>
        <b>${formatCompactMoney(prop.price)}</b>
      </div>
    </article>
  `).join("");

  els.moodboardList.innerHTML = props.map((prop) => `
    <div class="moodboard-list-item">
      <div class="moodboard-list-item__thumb" style="--photo-a: ${prop.colors?.[0] || "#ead8bd"}; --photo-b: ${prop.colors?.[1] || "#bd8d35"}">${renderPhoto(prop)}</div>
      <div>
        <strong>${escapeHtml(getCartDisplayName(prop.name))}</strong>
        <span>${escapeHtml(prop.code)} · ${formatCompactMoney(prop.price)} / día</span>
      </div>
      <button type="button" data-remove-moodboard="${escapeHtml(prop.id)}" aria-label="Quitar ${escapeHtml(prop.name)} del moodboard">×</button>
    </div>
  `).join("");
}

function bindProductKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.productPage.hidden) {
      closeProductPage();
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") return;
    const productCard = event.target.closest?.("[data-product-id]");
    if (!productCard) return;
    event.preventDefault();
    openProductPage(productCard.dataset.productId);
  });
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

function bindCatalogWheelScroll() {
  document.addEventListener("wheel", (event) => {
    if (state.activePage !== "catalogo" || isMobileViewport() || document.body.classList.contains("product-route-active")) return;
    if (event.target.closest("dialog")) return;

    const targetScroller = event.target.closest("#quotePanel")
      ? els.cartList
      : els.catalogGrid;

    if (!targetScroller || !targetScroller.scrollHeight || !event.deltaY) return;
    if (targetScroller.scrollHeight <= targetScroller.clientHeight) return;

    targetScroller.scrollTop += event.deltaY;
    event.preventDefault();
    event.stopPropagation();
  }, { passive: false });
}

function submitContactLead(event) {
  event.preventDefault();
  const name = els.contactName.value.trim();
  const whatsapp = els.contactWhatsapp.value.trim();
  const message = els.contactMessage.value.trim();

  if (!name || !whatsapp) {
    els.contactStatus.textContent = "Agrega nombre y WhatsApp para continuar.";
    els.contactStatus.className = "form-status form-status--error";
    return;
  }

  els.contactStatus.textContent = "Abriendo WhatsApp con tu mensaje.";
  els.contactStatus.className = "form-status form-status--success";
  const lines = [
    "Hola Hora Dorada, quiero información para una renta de props.",
    `Nombre: ${name}`,
    `WhatsApp: ${whatsapp}`,
    message ? `Necesito: ${message}` : ""
  ].filter(Boolean);
  openBusinessWhatsApp(lines);
}

function shareWhatsApp() {
  const quote = getQuote();
  const lines = [
    "Hola, quiero revisar esta cotización estimada de Hora Dorada Prop House:",
    `Fechas: ${formatDate(state.startDate)} a ${formatDate(state.endDate)}`,
    `Props: ${quote.available.map((prop) => prop.code).join(", ")}`,
    `Total estimado: ${formatMoney(quote.total)}`
  ];

  openBusinessWhatsApp(lines);
}

function openBusinessWhatsApp(lines) {
  window.open(`https://wa.me/${businessWhatsAppNumber}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
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

function setSelectedIds(ids, options = {}) {
  state.selectedIds = [...new Set(ids)].filter(Boolean);
  saveSelectedIds();

  if (options.render === false) return;
  renderCart();
  updateCatalogSelectionStates();
}

function toggleSelected(id) {
  setSelectedIds(state.selectedIds.includes(id)
    ? state.selectedIds.filter((selectedId) => selectedId !== id)
    : [...state.selectedIds, id]);
}

function removeSelected(id) {
  setSelectedIds(state.selectedIds.filter((selectedId) => selectedId !== id));
}

function getMoodboardProps() {
  return state.moodboardIds.map((id) => state.props.find((prop) => prop.id === id)).filter(Boolean);
}

function setMoodboardIds(ids, options = {}) {
  state.moodboardIds = [...new Set(ids)].filter(Boolean);
  saveMoodboardIds();

  if (options.render === false) return;
  renderMoodboard();
  updateCatalogMoodboardStates();
}

function toggleMoodboard(id) {
  setMoodboardIds(state.moodboardIds.includes(id)
    ? state.moodboardIds.filter((moodboardId) => moodboardId !== id)
    : [...state.moodboardIds, id]);
}

function removeMoodboardItem(id) {
  setMoodboardIds(state.moodboardIds.filter((moodboardId) => moodboardId !== id));
}

function sendMoodboardToQuote() {
  const moodboardIds = getMoodboardProps().map((prop) => prop.id);
  if (!moodboardIds.length) return;

  const newQuoteIds = moodboardIds.filter((id) => !state.selectedIds.includes(id));
  if (!newQuoteIds.length) {
    showToast("Todos los props del moodboard ya están en cotización.", true);
    openQuotePanelFromMoodboard();
    return;
  }

  setSelectedIds([...state.selectedIds, ...newQuoteIds]);
  showToast("Moodboard agregado a cotización.", true);
  openQuotePanelFromMoodboard();
}

function openQuotePanelFromMoodboard() {
  if (window.location.hash === "#catalogo") {
    setQuotePanelOpen(true);
    return;
  }

  window.location.hash = "catalogo";
  window.setTimeout(() => setQuotePanelOpen(true), 0);
}

function loadSavedSelectedIds(fallback = []) {
  const raw = localStorage.getItem(cartStorageKey);
  if (raw === null) return [...fallback];

  try {
    const saved = JSON.parse(raw);
    return Array.isArray(saved) ? saved.map(String) : [...fallback];
  } catch {
    return [...fallback];
  }
}

function saveSelectedIds() {
  localStorage.setItem(cartStorageKey, JSON.stringify(state.selectedIds));
}

function loadSavedMoodboardIds() {
  const raw = localStorage.getItem(moodboardStorageKey);
  if (raw === null) return [];

  try {
    const saved = JSON.parse(raw);
    return Array.isArray(saved) ? saved.map(String) : [];
  } catch {
    return [];
  }
}

function saveMoodboardIds() {
  localStorage.setItem(moodboardStorageKey, JSON.stringify(state.moodboardIds));
}

function loadSavedDates() {
  try {
    return { ...defaultDates, ...(JSON.parse(localStorage.getItem(datesStorageKey) || "{}") || {}) };
  } catch {
    return { ...defaultDates };
  }
}

function saveDates() {
  localStorage.setItem(datesStorageKey, JSON.stringify({
    startDate: state.startDate,
    endDate: state.endDate
  }));
}

function updateCatalogSelectionStates() {
  document.querySelectorAll("[data-add]").forEach((button) => {
    const prop = state.props.find((item) => item.id === button.dataset.add);
    if (!prop) return;

    const selected = state.selectedIds.includes(prop.id);
    button.classList.toggle("add-button--selected", selected);
    button.classList.toggle("product-add--selected", selected);
    button.textContent = button.classList.contains("product-add")
      ? selected ? "Quitar de la cotización" : "Agregar a cotización"
      : selected ? "✓" : "+";
    button.setAttribute("aria-label", `${selected ? "Quitar" : "Agregar"} ${prop.name}`);
  });
}

function updateCatalogMoodboardStates() {
  document.querySelectorAll("[data-moodboard]").forEach((button) => {
    const prop = state.props.find((item) => item.id === button.dataset.moodboard);
    if (!prop) return;

    const inMoodboard = state.moodboardIds.includes(prop.id);
    button.classList.toggle("moodboard-button--selected", inMoodboard);
    button.classList.toggle("product-moodboard--selected", inMoodboard);
    if (button.classList.contains("product-moodboard")) {
      button.textContent = inMoodboard ? "Quitar del moodboard" : "Agregar a moodboard";
    }
    button.setAttribute("aria-label", `${inMoodboard ? "Quitar" : "Agregar"} ${prop.name} al moodboard`);
  });
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
