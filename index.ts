import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer as createHttpServer } from "http";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Set a startup timeout to ensure the server starts promptly
const STARTUP_TIMEOUT = 5000; // 5 seconds
let serverStarted = false;

(async () => {
  // Create a timeout promise that rejects after STARTUP_TIMEOUT
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error(`Server startup timed out after ${STARTUP_TIMEOUT}ms`));
      }
    }, STARTUP_TIMEOUT);
  });

  // Race the server startup against the timeout
  try {
    await Promise.race([
      (async () => {
        try {
          // Only force fast startup in development mode
          if (process.env.NODE_ENV !== 'production') {
            process.env.FAST_STARTUP = 'true';
            console.log('Starting server with fast simulation mode...');
          } else {
            console.log('Starting server in production mode...');
          }
          const server = await registerRoutes(app);

          app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
            const status = err.status || err.statusCode || 500;
            const message = err.message || "Internal Server Error";

            res.status(status).json({ message });
            throw err;
          });

          // importantly only setup vite in development and after
          // setting up all the other routes so the catch-all route
          // doesn't interfere with the other routes
          if (app.get("env") === "development") {
            await setupVite(app, server);
          } else {
            serveStatic(app);
          }

          // ALWAYS serve the app on port 5000
          // this serves both the API and the client.
          // It is the only port that is not firewalled.
          const port = process.env.PORT || process.env.SERVER_PORT || 5000;
          const host = process.env.HOST || '0.0.0.0';
          
          server.listen({
            port,
            host,
            reusePort: true,
          }, () => {
            serverStarted = true;
            log(`Server running at http://${host}:${port}`);
          });
          
          return server;
        } catch (error) {
          console.error('Error during server startup:', error);
          throw error;
        }
      })(),
      timeoutPromise
    ]);
  } catch (error) {
    console.error('Critical server startup error:', error);
    
    // Start a minimal server to inform of the error
    const emergencyServer = createHttpServer((req: any, res: any) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Server failed to start properly', 
        message: 'The TON Education server encountered a critical startup issue. Please try again later.'
      }));
    });
    
    emergencyServer.listen(5000, '0.0.0.0', () => {
      console.log('Emergency server started on port 5000');
    });
  }
})();