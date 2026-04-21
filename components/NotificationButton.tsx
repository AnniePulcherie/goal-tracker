"use client";

import { useState, useEffect } from "react";

export default function NotificationButton() {
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    checkSubscription();
  }, []);

  async function checkSubscription() {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    setSubscribed(!!sub);
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return reg;
  }

  async function subscribe() {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      const reg = await registerServiceWorker();
      if (!reg) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      setSubscribed(true);
    } catch (error) {
      console.error("Erreur subscription:", error);
    }
    setLoading(false);
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;

      await fetch("/api/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });

      await sub.unsubscribe();
      setSubscribed(false);
    } catch (error) {
      console.error("Erreur unsubscription:", error);
    }
    setLoading(false);
  }

  if (!mounted) return null;

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  return (
    <div>
      {subscribed ? (
        <button
          onClick={unsubscribe}
          disabled={loading}
          className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
          {loading ? "..." : "Rappels activés"}
        </button>
      ) : (
        <button
          onClick={subscribe}
          disabled={loading || permission === "denied"}
          className="flex items-center gap-2 text-sm bg-purple-50 text-purple-700 px-4 py-2 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          <span className="text-base">🔔</span>
          {loading ? "..." : permission === "denied" ? "Notifications bloquées" : "Activer les rappels"}
        </button>
      )}
    </div>
  );
}