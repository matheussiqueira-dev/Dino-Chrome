import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";

const env = loadEnv();
const app = createApp(env);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Orion Run server online at http://localhost:${env.port}`);
});