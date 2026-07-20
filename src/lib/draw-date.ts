const DRAW_TIME_ZONE = "America/Sao_Paulo";

export function formatDrawDate(value: Date | string): string {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: DRAW_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDrawDateForFilename(value: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DRAW_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
