import { combineSlices, configureStore } from '@reduxjs/toolkit';

/**
 * Root reducer of the single parent store. Register every feature slice here.
 */
const rootReducer = combineSlices();

/** The application's one Redux store (one of the two allowed singletons, with the event bus). */
export const store = configureStore({ reducer: rootReducer });
