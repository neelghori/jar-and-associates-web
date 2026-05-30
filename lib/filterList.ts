export function filterBySearch<T>(
  items: T[],
  query: string,
  getFields: (item: T) => (string | number | null | undefined)[]
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) =>
    getFields(item).some((field) => String(field ?? '').toLowerCase().includes(q))
  );
}
