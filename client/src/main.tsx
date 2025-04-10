import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";
import { query_client } from "./queries.ts";

const root_element = document.getElementById("root");

if (!root_element) {
	throw new Error("Failed to find the root element");
}

createRoot(root_element).render(
	<StrictMode>
		<QueryClientProvider client={query_client}>
			<App />
		</QueryClientProvider>
	</StrictMode>,
);
