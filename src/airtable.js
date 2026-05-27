const airtableApi = "https://api.airtable.com/v0";

export async function loadAirtableData(config) {
  assertAirtableConfig(config);

  const [props, rentals] = await Promise.all([
    fetchInventory(config),
    fetchRentals(config)
  ]);

  return { props, rentals };
}

export async function createQuoteRequest(config, quote, client) {
  assertAirtableConfig(config);

  const fields = config.fields.requests;
  const payload = {
    fields: {
      [fields.clientName]: client.name || "",
      [fields.whatsapp]: client.whatsapp || "",
      [fields.notes]: client.notes || "",
      [fields.start]: quote.startDate,
      [fields.end]: quote.endDate,
      [fields.days]: quote.days,
      [fields.props]: quote.available.map((prop) => `${prop.code} - ${prop.name}`).join("\n"),
      [fields.subtotal]: quote.subtotal,
      [fields.iva]: quote.iva,
      [fields.total]: quote.total,
      [fields.deposit]: quote.deposit,
      [fields.status]: "Nueva"
    }
  };

  return airtableRequest(config, config.tables.requests, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

async function fetchInventory(config) {
  const records = await fetchAllRecords(config, config.tables.inventory);
  const fields = config.fields.inventory;

  return records.map((record) => {
    const photoField = record.fields[fields.photo];
    const photo = Array.isArray(photoField) && photoField[0] ? photoField[0].url : "";

    return {
      id: record.id,
      name: cleanText(record.fields[fields.name]),
      code: cleanText(record.fields[fields.code]),
      state: cleanText(record.fields[fields.state]),
      category: cleanText(record.fields[fields.category]),
      style: fields.style ? cleanText(record.fields[fields.style]) : cleanText(record.fields[fields.category]),
      price: Number(record.fields[fields.price]) || 0,
      photo,
      art: "prop",
      colors: ["#ead8bd", "#bd8d35"]
    };
  }).filter((prop) => prop.name && prop.code);
}

async function fetchRentals(config) {
  const records = await fetchAllRecords(config, config.tables.rentals);
  const fields = config.fields.rentals;

  return records.map((record) => ({
    id: record.id,
    status: cleanText(record.fields[fields.status]),
    start: normalizeDate(record.fields[fields.start]),
    end: normalizeDate(record.fields[fields.end]),
    propIds: normalizeLinkedRecords(record.fields[fields.props])
  })).filter((rental) => rental.start && rental.end && rental.propIds.length);
}

async function fetchAllRecords(config, tableName) {
  const records = [];
  let offset = "";

  do {
    const search = new URLSearchParams();
    if (offset) search.set("offset", offset);

    const response = await airtableRequest(config, tableName, {
      method: "GET",
      query: search
    });

    records.push(...(response.records || []));
    offset = response.offset || "";
  } while (offset);

  return records;
}

async function airtableRequest(config, tableName, options = {}) {
  const query = options.query ? `?${options.query.toString()}` : "";
  const url = `${airtableApi}/${config.baseId}/${encodeURIComponent(tableName)}${query}`;
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: options.body
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Airtable respondió ${response.status}: ${details}`);
  }

  return response.json();
}

function assertAirtableConfig(config) {
  if (!config.baseId || !config.token) {
    throw new Error("Falta Base ID o token de Airtable.");
  }
}

function cleanText(value) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value || "").trim();
}

function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function normalizeLinkedRecords(value) {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}
