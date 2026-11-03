import { createContext, useContext, createSignal, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { query, createAsync, revalidate } from "@solidjs/router";

const WebSocketContext = createContext();

export function WebSocketProvider(props) {
    const ws = new WebSocket('ws://10.246.12.118:3000/ws');

    return <WebSocketContext.Provider value={ws}>{props.children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
    return useContext(WebSocketContext);
}
