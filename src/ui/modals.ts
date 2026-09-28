import { es } from "../content/es";
import type { Memo } from "../content/types";
import { el } from "./dom";

interface Button {
  label: string;
  primary?: boolean;
  onClick?: () => void;
}

function openModal(card: HTMLElement, buttons: readonly Button[]): void {
  const backdrop = el("div", "modal-backdrop");
  const actions = el("div", "modal-actions");
  for (const b of buttons) {
    const button = el("button", b.primary ? "btn btn-primary" : "btn", b.label);
    button.addEventListener("click", () => {
      backdrop.remove();
      b.onClick?.();
    });
    actions.append(button);
  }
  card.append(actions);
  backdrop.append(card);
  document.body.append(backdrop);
  actions.querySelector<HTMLButtonElement>(".btn-primary")?.focus();
}

export function showMemo(memo: Memo, onClose?: () => void): void {
  const card = el("div", "modal memo");
  card.setAttribute("role", "dialog");
  card.append(
    el("div", "memo-header", es.ui.memoHeader),
    el("div", "memo-meta", es.ui.memoFrom),
    el("div", "memo-meta", es.ui.memoTo),
    el("h2", "memo-title", memo.title),
  );
  for (const p of memo.paragraphs) card.append(el("p", "", p));
  openModal(card, [{ label: memo.dismiss, primary: true, onClick: onClose }]);
}

export function showOffline(elapsed: string, gain: string, line: string): void {
  const card = el("div", "modal");
  card.setAttribute("role", "dialog");
  card.append(
    el("h2", "", es.ui.offlineTitle),
    el("p", "", es.ui.offlineBody(elapsed, gain)),
    el("p", "pandora-line", `«${line}»`),
  );
  openModal(card, [{ label: es.ui.offlineDismiss, primary: true }]);
}

export function confirmReset(onConfirm: () => void): void {
  const card = el("div", "modal");
  card.setAttribute("role", "alertdialog");
  card.append(el("h2", "", es.ui.resetConfirmTitle), el("p", "", es.ui.resetConfirmBody));
  openModal(card, [
    { label: es.ui.resetConfirmNo, primary: true },
    { label: es.ui.resetConfirmYes, onClick: onConfirm },
  ]);
}

export function toast(text: string): void {
  let host = document.querySelector<HTMLElement>(".toasts");
  if (!host) {
    host = el("div", "toasts");
    host.setAttribute("aria-live", "polite");
    document.body.append(host);
  }
  const node = el("div", "toast", text);
  host.append(node);
  setTimeout(() => node.classList.add("toast-out"), 3_500);
  setTimeout(() => node.remove(), 4_000);
}
