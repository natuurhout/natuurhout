/*
 * The admin's only script, served at /app.js (CSP script-src 'self').
 * Progressive enhancement: every page works without it.
 * - Pipeline board: drag a card to another column to change its status
 *   (POST with header x-board: 1, answered with 204). On any failure,
 *   including an expired Access session, the card moves back.
 * - Toolbar selects submit their form on change.
 */
export const APP_JS = String.raw`"use strict";
(() => {
  for (const s of document.querySelectorAll("form.toolbar select")) s.addEventListener("change", () => s.form.requestSubmit());

  const board = document.querySelector("[data-board]");
  if (!board) return;
  const base = board.dataset.board;
  const money = new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  let card = null;
  let from = null;

  function toast(text) {
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.append(t);
    setTimeout(() => t.remove(), 4000);
  }
  function tally(col, sign, k) {
    const n = col.querySelector("[data-n]");
    n.dataset.n = String(Number(n.dataset.n) + sign);
    n.textContent = n.dataset.n;
    const sum = col.querySelector("[data-sum]");
    if (sum) {
      sum.dataset.sum = String(Number(sum.dataset.sum) + sign * Number(k.dataset.total || 0));
      sum.textContent = Number(sum.dataset.sum) ? money.format(Number(sum.dataset.sum)) : "";
    }
    const body = col.querySelector(".col-body");
    if (!body.querySelector(".k") && !body.querySelector(".empty")) body.insertAdjacentHTML("beforeend", '<div class="empty">Geen aanvragen</div>');
  }
  function place(body, k) {
    const empty = body.querySelector(".empty");
    if (empty) empty.remove();
    body.prepend(k);
  }
  const clear = () => board.querySelectorAll(".over").forEach((x) => x.classList.remove("over"));
  const lane = (e) => (e.target instanceof Element ? e.target.closest(".col-body") : null);

  board.addEventListener("dragstart", (e) => {
    card = e.target instanceof Element ? e.target.closest(".k") : null;
    if (!card) return;
    from = card.closest(".col");
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.dataset.id);
  });
  board.addEventListener("dragend", () => {
    if (card) card.classList.remove("dragging");
    card = null;
    clear();
  });
  board.addEventListener("dragover", (e) => {
    const body = lane(e);
    if (!card || !body) return;
    e.preventDefault();
    if (!body.classList.contains("over")) {
      clear();
      body.classList.add("over");
    }
  });
  board.addEventListener("dragleave", (e) => {
    const body = lane(e);
    if (body && !body.contains(e.relatedTarget)) body.classList.remove("over");
  });
  board.addEventListener("drop", async (e) => {
    const body = lane(e);
    if (!card || !body) return;
    e.preventDefault();
    clear();
    const k = card, src = from, to = body.closest(".col");
    if (to === src) return;
    place(body, k);
    tally(src, -1, k);
    tally(to, 1, k);
    const fd = new FormData();
    fd.set("action", "status");
    fd.set("status", to.dataset.status);
    let ok = false;
    try {
      const r = await fetch(base + "/aanvragen/" + k.dataset.id, { method: "POST", body: fd, headers: { "x-board": "1" }, redirect: "manual", credentials: "same-origin" });
      ok = r.status === 204;
    } catch {
      ok = false;
    }
    if (ok) return toast("Verplaatst naar " + to.dataset.label);
    place(src.querySelector(".col-body"), k);
    tally(to, -1, k);
    tally(src, 1, k);
    toast("Niet opgeslagen. Herlaad de pagina en probeer opnieuw.");
  });
})();
`;
