import { useEffect, useRef } from "react";

export function useVisualViewportHeight<T extends HTMLElement>() {
	const ref = useRef<T>(null);

	useEffect(() => {
		const update_height = () => {
			if (ref.current && window.visualViewport) {
				ref.current.style.height = `${window.visualViewport.height}px`;
			}
		};

		window.visualViewport?.addEventListener("resize", update_height);
		window.visualViewport?.addEventListener("scroll", update_height);

		update_height();

		return () => {
			window.visualViewport?.removeEventListener("resize", update_height);
			window.visualViewport?.removeEventListener("scroll", update_height);
		};
	}, []);

	return ref;
}
