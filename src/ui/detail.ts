import { es } from "../content/es";
import { el } from "./dom";
import { placeTooltip } from "./placement";
import { renderDetails, type TooltipContent } from "./tooltip";

export interface DetailCardOptions {
  /** The Store item the card is about; the card opens above or below it. */
  anchor: HTMLElement;
  content: () => TooltipContent;
  canBuy: () => boolean;
  /** Runs the item's normal buy path; returns whether the purchase went through. */
  buy: () => boolean;
  onClose?: () => void;
}

export interface DetailCard {
  /** Re-reads the content and affordability (the bank changes every frame). */
  refresh(): void;
  close(): void;
}

/**
 * The touch replacement for an Upgrade's hover tooltip: its details plus a
 * Comprar button, so a tap never buys blind. Tapping outside the card, ✕ or
 * Escape closes it; the transparent backdrop swallows that outside tap.
 */
export function openDetailCard(options: DetailCardOptions): DetailCard {
  const backdrop = el("div", "detail-backdrop");
  const card = el("div", "detail-card");
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  const body = el("div", "detail-body");
  const close = el("button", "detail-close", "✕");
  close.setAttribute("aria-label", es.ui.close);
  const buy = el("button", "btn btn-primary detail-buy", es.ui.buy);
  card.append(close, body, buy);
  backdrop.append(card);

  let open = true;
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") handle.close();
  };
  const handle: DetailCard = {
    refresh() {
      if (!open) return;
      const c = options.content();
      renderDetails(body, c, "detail-title");
      card.setAttribute("aria-label", c.title);
      buy.setAttribute("aria-disabled", String(!options.canBuy()));
    },
    close() {
      if (!open) return;
      open = false;
      backdrop.remove();
      document.removeEventListener("keydown", onKey);
      opener?.focus({ preventScroll: true });
      options.onClose?.();
    },
  };

  close.addEventListener("click", () => handle.close());
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) handle.close();
  });
  buy.addEventListener("click", () => {
    if (options.buy()) handle.close();
    else handle.refresh();
  });
  document.addEventListener("keydown", onKey);

  handle.refresh();
  document.body.append(backdrop);
  const { left, top } = placeTooltip(
    options.anchor.getBoundingClientRect(),
    card.getBoundingClientRect(),
    { width: window.innerWidth, height: window.innerHeight },
    true,
  );
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
  buy.focus({ preventScroll: true });
  return handle;
}
