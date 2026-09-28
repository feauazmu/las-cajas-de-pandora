export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Public-folder URL that works with a relative Vite base. */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}
