"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushSubscriber() {
  const [estado, setEstado] = useState<"idle" | "granted" | "denied" | "unsupported">("idle");
  const [mostrarBanner, setMostrarBanner] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function registrarSW() {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();
      if (existing) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
    } catch {
      // Fallo silencioso — push no es crítico
    }
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       lee APIs solo-cliente (navigator/Notification/sessionStorage) que no existen
       durante el SSR; no hay forma de derivar este estado en el render sin un efecto. */
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("unsupported");
      return;
    }

    const permission = Notification.permission;
    if (permission === "granted") {
      setEstado("granted");
      registrarSW();
    } else if (permission === "denied") {
      setEstado("denied");
    } else {
      // Solo mostramos el banner si no han decidido aún
      const ignorado = sessionStorage.getItem("push-banner-ignorado");
      if (!ignorado) setMostrarBanner(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  async function activar() {
    setCargando(true);
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setEstado("granted");
      setMostrarBanner(false);
      await registrarSW();
    } else {
      setEstado("denied");
      setMostrarBanner(false);
    }
    setCargando(false);
  }

  function ignorar() {
    sessionStorage.setItem("push-banner-ignorado", "1");
    setMostrarBanner(false);
  }

  if (estado === "unsupported" || estado === "denied" || estado === "granted") return null;
  if (!mostrarBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-border bg-card shadow-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-1.5">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-semibold text-card-foreground">Activar notificaciones</p>
        </div>
        <button
          onClick={ignorar}
          className="text-muted-foreground hover:text-card-foreground transition-colors mt-0.5"
          title="Ignorar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-muted leading-relaxed">
        Recibe una alerta en tu pantalla cuando llegue un lead nuevo, aunque no tengas esta pestaña activa.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={activar}
          disabled={cargando}
          className="flex-1 h-8 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {cargando ? "Activando…" : "Activar"}
        </button>
        <button
          onClick={ignorar}
          className="flex items-center gap-1 h-8 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-card-foreground hover:bg-accent/5 transition-colors"
        >
          <BellOff className="h-3.5 w-3.5" />
          Ahora no
        </button>
      </div>
    </div>
  );
}
