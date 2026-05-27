export function calculateRentalDays(start, end) {
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    return 1;
  }

  return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
}

export function datesOverlap(startA, endA, startB, endB) {
  return new Date(`${startA}T00:00:00`) <= new Date(`${endB}T23:59:59`) &&
    new Date(`${startB}T00:00:00`) <= new Date(`${endA}T23:59:59`);
}

export function getUnavailableMessage(count) {
  if (count === 1) {
    return "Este prop no se incluirá en la cotización porque está rentado en las fechas seleccionadas.";
  }

  return "Estos props no se incluirán en la cotización porque están rentados en las fechas seleccionadas.";
}

export function isPropUnavailable(propId, rentals, startDate, endDate) {
  return rentals.some((rental) => {
    const status = String(rental.status || "").toLowerCase();
    const isConfirmed = ["confirmada", "confirmado", "confirmada / pagada", "apartada"].some((value) => status.includes(value));

    return isConfirmed &&
      rental.propIds.includes(propId) &&
      datesOverlap(startDate, endDate, rental.start, rental.end);
  });
}

export function calculateQuote({ props, rentals, selectedIds, startDate, endDate }) {
  const days = calculateRentalDays(startDate, endDate);
  const selected = selectedIds.map((id) => props.find((prop) => prop.id === id)).filter(Boolean);
  const available = selected.filter((prop) => !isPropUnavailable(prop.id, rentals, startDate, endDate));
  const unavailable = selected.filter((prop) => isPropUnavailable(prop.id, rentals, startDate, endDate));
  const subtotal = available.reduce((sum, prop) => sum + prop.price * days, 0);
  const iva = Math.round(subtotal * 0.16);
  const total = subtotal + iva;
  const deposit = Math.round(total * 0.2);

  return { days, selected, available, unavailable, subtotal, iva, total, deposit };
}
