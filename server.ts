import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const NOTIFICATIONS_FILE = path.join(process.cwd(), 'notifications.json');

  // Helper to read/write notifications to local file
  const getNotifications = async () => {
    try {
      const data = await fs.promises.readFile(NOTIFICATIONS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const saveNotifications = async (notifs: any[]) => {
    await fs.promises.writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifs, null, 2));
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/notifications", async (req, res) => {
    const notifications = await getNotifications();
    res.json(notifications);
  });

  app.post("/api/notifications", async (req, res) => {
    const notifications = await getNotifications();
    const newNotification = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      status: 'pending'
    };
    notifications.unshift(newNotification);
    await saveNotifications(notifications);
    res.json(newNotification);
  });

  app.patch("/api/notifications/:id", async (req, res) => {
    const { id } = req.params;
    const notifications = await getNotifications();
    const index = notifications.findIndex((n: any) => n.id === id);
    if (index !== -1) {
      notifications[index] = { ...notifications[index], ...req.body };
      await saveNotifications(notifications);
      res.json(notifications[index]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  app.delete("/api/notifications", async (req, res) => {
    await saveNotifications([]);
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
