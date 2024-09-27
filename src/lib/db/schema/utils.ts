import { UNITS } from '$lib/constants';

export function isValidUnit(unit: string): unit is (typeof UNITS)[number] {
	return UNITS.includes(unit as (typeof UNITS)[number]);
}
