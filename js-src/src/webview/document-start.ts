
// import { ConsoleInterceptor } from './global/console';


import { DispatchToNativeEvent } from './bridge/dispatch-to-native-event';
import { bridge } from './bridge/bridge';

console.warn("Clearing bridge items on native side")
new DispatchToNativeEvent("clearbridgeitems").dispatchAndResolve();

(window.top as any).webkit.messageHandlers.hybrid.bridge = bridge;
bridge.attachToWindow(window);



// import './register-to-window';

// If this is a page reload, we might still have bridge items cached
// on the native side. Just to be sure, clear them out.

// bridge.attachToWindow(window);


// (window as any).shimDidLoad = true;

// export default bridge;