import { useSyncExternalStore } from "react";
import type { CartItem } from "@/types";

const STORAGE_KEY = "cart";

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

let items: CartItem[] = readStorage();
const listeners = new Set<() => void>();

function emit() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable — cart still works for this tab session
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return items;
}

const EMPTY_SERVER_SNAPSHOT: CartItem[] = [];

function getServerSnapshot(): CartItem[] {
  return EMPTY_SERVER_SNAPSHOT;
}

function addItem(item: CartItem) {
  const existing = items.find((i) => i.productId === item.productId);
  items = existing
    ? items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      )
    : [...items, item];
  emit();
}

function removeItem(productId: string) {
  items = items.filter((i) => i.productId !== productId);
  emit();
}

function setQuantity(productId: string, quantity: number) {
  items = items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
  emit();
}

function clearCart() {
  items = [];
  emit();
}

export function useCart() {
  const cartItems = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { items: cartItems, addItem, removeItem, setQuantity, clearCart };
}
