// Runs the full Hardhat test suite and saves the complete output to
// evidence/test-output.txt (header with date/versions + raw output).
// Usage: npm run test:log        Exit code is the same as `npx hardhat test`.
const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "evidence", "test-output.txt");
fs.mkdirSync(path.dirname(out), { recursive: true });

const version = (cmd) => {
  try { return execSync(cmd, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
  catch { return "unknown"; }
};

const header = [
  "$ npx hardhat test --config hardhat.config.cjs",
  `date (UTC): ${new Date().toISOString()}`,
  `node: ${process.version}`,
  `hardhat: ${version("npx hardhat --version")}`,
  "",
].join("\n");

const stream = fs.createWriteStream(out);
stream.write(`${header}\n`);

const child = spawn("npx", ["hardhat", "test", "--config", "hardhat.config.cjs"], {
  cwd: root,
  shell: true,
  env: process.env,
});
child.stdout.on("data", (chunk) => { process.stdout.write(chunk); stream.write(chunk); });
child.stderr.on("data", (chunk) => { process.stderr.write(chunk); stream.write(chunk); });
child.on("close", (code) => {
  stream.write(`\n[exit code: ${code}]\n`);
  stream.end(() => {
    console.log(`\nSaved ${path.relative(root, out)}`);
    process.exit(code === null ? 1 : code);
  });
});
