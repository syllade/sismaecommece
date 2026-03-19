import { spawn } from "node:child_process";

function run(command, args) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: true,
  });
}

const server = run("npm", ["run", "dev:server"]);
const client = run("npm", ["run", "dev"]);

function shutdown(code = 0) {
  if (!server.killed) server.kill();
  if (!client.killed) client.kill();
  process.exit(code);
}

server.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`dev:server exited with code ${code}`);
    shutdown(code);
  }
});

client.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`dev exited with code ${code}`);
    shutdown(code);
  }
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
