import { describe, it, expect } from 'vitest';
import {
	SUPPORTED_CURRENCIES,
	CURRENCY_SELECT_OPTIONS,
	convertFromUsd,
	formatCurrencyDisplay,
	formatCostWithFallback,
	getCurrencySymbol,
	isSupportedCurrency,
} from './currency.js';

describe('SUPPORTED_CURRENCIES', () => {
	it('contains exactly 31 entries (USD + 30 ECB currencies)', () => {
		const codes = Object.keys(SUPPORTED_CURRENCIES);
		expect(codes).toHaveLength(31);
	});

	it('includes USD with correct name', () => {
		expect(SUPPORTED_CURRENCIES.USD).toEqual({ code: 'USD', name: 'US Dollar' });
	});

	it('includes all 30 ECB currencies', () => {
		const expectedEcbCodes = [
			'EUR',
			'GBP',
			'JPY',
			'CZK',
			'CHF',
			'AUD',
			'BGN',
			'BRL',
			'CAD',
			'CNY',
			'DKK',
			'HKD',
			'HUF',
			'IDR',
			'ILS',
			'INR',
			'ISK',
			'KRW',
			'MXN',
			'MYR',
			'NOK',
			'NZD',
			'PHP',
			'PLN',
			'RON',
			'SEK',
			'SGD',
			'THB',
			'TRY',
			'ZAR',
		];
		for (const code of expectedEcbCodes) {
			expect(SUPPORTED_CURRENCIES).toHaveProperty(code);
		}
	});

	it('each entry has a 3-letter code and a non-empty name', () => {
		for (const [key, entry] of Object.entries(SUPPORTED_CURRENCIES)) {
			expect(entry.code).toBe(key);
			expect(entry.code).toMatch(/^[A-Z]{3}$/);
			expect(entry.name.length).toBeGreaterThan(0);
		}
	});

	it('has correct names for select currencies', () => {
		expect(SUPPORTED_CURRENCIES.EUR).toEqual({ code: 'EUR', name: 'Euro' });
		expect(SUPPORTED_CURRENCIES.CZK).toEqual({ code: 'CZK', name: 'Czech Koruna' });
		expect(SUPPORTED_CURRENCIES.GBP).toEqual({ code: 'GBP', name: 'British Pound' });
		expect(SUPPORTED_CURRENCIES.JPY).toEqual({ code: 'JPY', name: 'Japanese Yen' });
	});
});

describe('CURRENCY_SELECT_OPTIONS', () => {
	it('has 31 entries matching SUPPORTED_CURRENCIES', () => {
		expect(CURRENCY_SELECT_OPTIONS).toHaveLength(31);
	});

	it('each option has value and label in "CODE — Name" format', () => {
		for (const option of CURRENCY_SELECT_OPTIONS) {
			expect(option.value).toMatch(/^[A-Z]{3}$/);
			expect(option.label).toContain(' — ');
			expect(option.label).toMatch(/^[A-Z]{3} — .+$/);
		}
	});

	it('includes USD option with correct label', () => {
		const usdOption = CURRENCY_SELECT_OPTIONS.find((o) => o.value === 'USD');
		expect(usdOption).toEqual({ value: 'USD', label: 'USD — US Dollar' });
	});
});

describe('convertFromUsd', () => {
	it('converts 10 USD to EUR at rate 0.92', () => {
		expect(convertFromUsd(10, 'EUR', { EUR: 0.92 })).toBeCloseTo(9.2, 10);
	});

	it('returns amount unchanged when target is USD', () => {
		expect(convertFromUsd(10, 'USD', {})).toBe(10);
	});

	it('returns amount as fallback when rate not found', () => {
		expect(convertFromUsd(10, 'XYZ', {})).toBe(10);
	});

	it('handles zero amount', () => {
		expect(convertFromUsd(0, 'EUR', { EUR: 0.92 })).toBe(0);
	});

	it('handles negative amount', () => {
		expect(convertFromUsd(-5, 'CZK', { CZK: 22.5 })).toBe(-112.5);
	});
});

describe('formatCurrencyDisplay', () => {
	it('formats EUR amount with euro sign', () => {
		const result = formatCurrencyDisplay(9.2, 'EUR');
		expect(result).toContain('€');
		expect(result).toContain('9.20');
	});

	it('formats CZK amount with CZK symbol', () => {
		const result = formatCurrencyDisplay(225, 'CZK');
		expect(result).toContain('CZK');
	});

	it('formats USD amount as $10.00', () => {
		expect(formatCurrencyDisplay(10, 'USD')).toBe('$10.00');
	});

	it('formats GBP zero amount with pound sign', () => {
		const result = formatCurrencyDisplay(0, 'GBP');
		expect(result).toContain('£');
		expect(result).toContain('0.00');
	});

	it('formats JPY with yen sign and forced 2 decimal places', () => {
		const result = formatCurrencyDisplay(1234.5, 'JPY');
		expect(result).toContain('¥');
		expect(result).toContain('1,234.50');
	});
});

describe('getCurrencySymbol', () => {
	it('returns $ for USD', () => {
		expect(getCurrencySymbol('USD')).toBe('$');
	});

	it('returns € for EUR', () => {
		expect(getCurrencySymbol('EUR')).toBe('€');
	});

	it('returns £ for GBP', () => {
		expect(getCurrencySymbol('GBP')).toBe('£');
	});

	it('returns Intl-provided symbol for CZK', () => {
		const symbol = getCurrencySymbol('CZK');
		expect(typeof symbol).toBe('string');
		expect(symbol.length).toBeGreaterThan(0);
		expect(symbol).toBe('CZK');
	});
});

describe('isSupportedCurrency', () => {
	it('returns true for valid currency codes', () => {
		expect(isSupportedCurrency('USD')).toBe(true);
		expect(isSupportedCurrency('EUR')).toBe(true);
		expect(isSupportedCurrency('CZK')).toBe(true);
	});

	it('returns false for invalid currency codes', () => {
		expect(isSupportedCurrency('XYZ')).toBe(false);
		expect(isSupportedCurrency('INVALID')).toBe(false);
	});

	it('returns false for non-string values', () => {
		expect(isSupportedCurrency(null)).toBe(false);
		expect(isSupportedCurrency(undefined)).toBe(false);
		expect(isSupportedCurrency(123)).toBe(false);
		expect(isSupportedCurrency({})).toBe(false);
	});

	it('returns false for lowercase currency codes', () => {
		expect(isSupportedCurrency('usd')).toBe(false);
		expect(isSupportedCurrency('eur')).toBe(false);
	});
});

describe('formatCostWithFallback', () => {
	it('formats USD amount directly', () => {
		expect(formatCostWithFallback(10, 'USD', 1)).toBe('$10.00');
	});

	it('converts and formats non-USD with valid rate', () => {
		const result = formatCostWithFallback(10, 'EUR', 0.92);
		expect(result).toContain('€');
		expect(result).toContain('9.20');
	});

	it('falls back to USD when exchange rate is null', () => {
		expect(formatCostWithFallback(10, 'EUR', null)).toBe('$10.00');
	});

	it('appends (USD) suffix when rates error and non-USD currency', () => {
		const result = formatCostWithFallback(10, 'EUR', null, true);
		expect(result).toBe('$10.00 (USD)');
	});

	it('does not append (USD) suffix for USD even with rates error', () => {
		const result = formatCostWithFallback(10, 'USD', 1, true);
		expect(result).toBe('$10.00');
	});
});
