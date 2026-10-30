// Makes the key pair of the run and a session token signed as the Administration module signs them.
const fs = require("fs");
const path = require("path");
const { generateKeyPairSync } = require("crypto");
const env = require("./env");

fs.mkdirSync(env.KEY_DIR, { recursive: true });
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
fs.writeFileSync(path.join(env.KEY_DIR, "private.pem"), privateKey);
fs.writeFileSync(path.join(env.KEY_DIR, "public.pem"), publicKey);
process.env.VARIAMOS_PRIVATE_KEY_PATH = path.join(env.KEY_DIR, "private.pem");
process.env.VARIAMOS_PUBLIC_KEY_PATH = path.join(env.KEY_DIR, "public.pem");

const { createJwt, initKeyStore } = require(path.join(env.BACKEND_DIR, "node_modules", "@variamosple", "variamos-security"));

(async () => {
  await initKeyStore();
  fs.writeFileSync(env.TOKEN_FILE, String(await createJwt(env.USER)));
  fs.writeFileSync(env.TOKEN2_FILE, String(await createJwt(env.USER2)));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
