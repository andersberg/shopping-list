import { formatInTimeZone } from 'date-fns-tz';

export function formatUTCToTimezone(date: string) {
	const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
	const utcDate = new Date(`${date}Z`);

	return formatInTimeZone(utcDate, timeZone, 'yyyy-MM-dd HH:mm:ss');
}
