import { createApp } from "vue";
import App from "./App.vue";

import "./assets/styles/normalize.css";
import "./assets/styles/style.css";

import "./demos/ipc";

import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import vuetify from "./plugins/vuetify";

const app = createApp(App);

// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

createApp(App)
  .use(ElementPlus)
  .use(vuetify)
  .mount("#app")
  .$nextTick(() => {
    postMessage({ payload: "removeLoading" }, "*");
  });
