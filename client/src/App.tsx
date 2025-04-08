import { MESSAGE } from "lib/constants";
import { useEffect } from "react";
import "./App.css";

function App() {
	useEffect(() => {
		fetch("/api")
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

export default App;
