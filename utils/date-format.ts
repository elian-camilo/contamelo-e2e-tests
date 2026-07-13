/** Reproduce el formato exacto del botón de fecha de la app: "jueves, 30 de julio de 2026". */
export function formatDueDateButtonLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
