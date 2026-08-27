import { registerRootComponent } from "expo";

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App).
// Garante que o ambiente fica corretamente configurado tanto na Expo Go
// como num build nativo.
registerRootComponent(App);
