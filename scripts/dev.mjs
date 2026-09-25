import { spawn } from "node:child_process";

const server = spawn(process.execPath, ["server/index.mjs"], { stdio: "inherit" });
const vite = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", "5173"], { stdio: "inherit" });

function stop() {
  server.kill("SIGTERM");
  vite.kill("SIGTERM");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("exit", (code) => {
  if (code) process.exit(code);
});
vite.on("exit", (code) => {
  stop();
  process.exit(code ?? 0);
});
