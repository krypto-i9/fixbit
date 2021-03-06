import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { createBrowserHistory } from "history";
import { routerMiddleware } from "connected-react-router";
import { createLogger } from "redux-logger";

import createRootReducer from "./rootReducer";

export const history = createBrowserHistory();
const rootReducer = createRootReducer(history);

const router = routerMiddleware(history);
const middleware = [...getDefaultMiddleware(), router];

if (process.env.NODE_ENV === "development") {
  const logger = createLogger({
    level: "info",
    collapsed: true,
  });
  middleware.push(logger);
}

export const configuredStore = (initialState) => {
  // Create Store
  const store = configureStore({
    reducer: rootReducer,
    middleware,
    preloadedState: initialState,
  });
  return store;
};
