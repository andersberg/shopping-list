import { useEffect, useState } from "react";

export function useMinLoadingTime(isLoading: boolean, minDuration = 1000) {
	const [is_loading_delayed, set_is_loading_delayed] = useState(isLoading);

	useEffect(() => {
		if (isLoading) {
			set_is_loading_delayed(true);
		} else {
			const timer = setTimeout(() => {
				set_is_loading_delayed(false);
			}, minDuration);
			return () => clearTimeout(timer);
		}
	}, [isLoading, minDuration]);

	return is_loading_delayed;
}
