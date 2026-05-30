export const SUPPORTED_CURRENCIES = {
	USD: { code: 'USD', name: 'US Dollar' },
	EUR: { code: 'EUR', name: 'Euro' },
	GBP: { code: 'GBP', name: 'British Pound' },
	JPY: { code: 'JPY', name: 'Japanese Yen' },
	CZK: { code: 'CZK', name: 'Czech Koruna' },
	CHF: { code: 'CHF', name: 'Swiss Franc' },
	AUD: { code: 'AUD', name: 'Australian Dollar' },
	BGN: { code: 'BGN', name: 'Bulgarian Lev' },
	BRL: { code: 'BRL', name: 'Brazilian Real' },
	CAD: { code: 'CAD', name: 'Canadian Dollar' },
	CNY: { code: 'CNY', name: 'Chinese Yuan' },
	DKK: { code: 'DKK', name: 'Danish Krone' },
	HKD: { code: 'HKD', name: 'Hong Kong Dollar' },
	HUF: { code: 'HUF', name: 'Hungarian Forint' },
	IDR: { code: 'IDR', name: 'Indonesian Rupiah' },
	ILS: { code: 'ILS', name: 'Israeli Shekel' },
	INR: { code: 'INR', name: 'Indian Rupee' },
	ISK: { code: 'ISK', name: 'Icelandic Krona' },
	KRW: { code: 'KRW', name: 'South Korean Won' },
	MXN: { code: 'MXN', name: 'Mexican Peso' },
	MYR: { code: 'MYR', name: 'Malaysian Ringgit' },
	NOK: { code: 'NOK', name: 'Norwegian Krone' },
	NZD: { code: 'NZD', name: 'New Zealand Dollar' },
	PHP: { code: 'PHP', name: 'Philippine Peso' },
	PLN: { code: 'PLN', name: 'Polish Zloty' },
	RON: { code: 'RON', name: 'Romanian Leu' },
	SEK: { code: 'SEK', name: 'Swedish Krona' },
	SGD: { code: 'SGD', name: 'Singapore Dollar' },
	THB: { code: 'THB', name: 'Thai Baht' },
	TRY: { code: 'TRY', name: 'Turkish Lira' },
	ZAR: { code: 'ZAR', name: 'South African Rand' },
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

export const CURRENCY_SELECT_OPTIONS: { value: string; label: string }[] = Object.values(
	SUPPORTED_CURRENCIES,
).map((entry) => ({
	value: entry.code,
	label: `${entry.code} — ${entry.name}`,
}));

export function convertFromUsd(
	amountUsd: number,
	targetCurrency: string,
	rates: Record<string, number>,
): number {
	if (targetCurrency === 'USD') {
		return amountUsd;
	}
	const rate = rates[targetCurrency];
	if (rate === undefined) {
		return amountUsd;
	}
	return amountUsd * rate;
}

export function formatCurrencyDisplay(amount: number, currencyCode: string): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currencyCode,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function getCurrencySymbol(currencyCode: string): string {
	const parts = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currencyCode,
	}).formatToParts(0);
	const currencyPart = parts.find((part) => part.type === 'currency');
	return currencyPart?.value ?? currencyCode;
}

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
	if (typeof value !== 'string') {
		return false;
	}
	return value in SUPPORTED_CURRENCIES;
}

export function formatCostWithFallback(
	amountUsd: number,
	currency: string,
	exchangeRate: number | null,
	ratesError: boolean = false,
): string {
	if (currency === 'USD' || exchangeRate === null) {
		const base = formatCurrencyDisplay(amountUsd, 'USD');
		if (ratesError && currency !== 'USD') {
			return `${base} (USD)`;
		}
		return base;
	}
	const converted = convertFromUsd(amountUsd, currency, { [currency]: exchangeRate });
	return formatCurrencyDisplay(converted, currency);
}
