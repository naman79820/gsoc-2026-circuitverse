
import { createApp } from "vue";
import EmbedOnlyApp from "./EmbedOnlyApp.vue";
window.embed = true;
window.isUserLoggedIn = false;
window.logixProjectId =
  new URLSearchParams(window.location.search).get("project_id") ||
  (window as any).logixProjectId ||
  "0";
import "./styles/css/main.stylesheet.css";
import "./styles/color_theme.scss";

import "./globalVariables";

const app = createApp(EmbedOnlyApp);

// No Pinia — embed never needs auth
// No router — embed is always loaded directly
// No Vuetify — embed uses plain HTML controls
// No i18n — embed UI has no translatable text

app.mount("#app");
