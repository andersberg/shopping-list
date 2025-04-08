import { hc } from "hono/client";
import type { ApiRouterType } from "lib/api";
import { MESSAGE } from "lib/constants";
import { useEffect } from "react";

import "./App.css";

const api_client = hc<ApiRouterType>("/api");

export function App() {
	useEffect(() => {
		api_client.index
			.$get()
			.then((res) => res.text())
			.then((data) => {
				console.log(data);
			});
	}, []);

	return (
		<div>
			<h1>{MESSAGE}</h1>
		</div>
	);
}
