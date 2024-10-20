import { type ColorInput, color as bunColor } from 'bun';

const colorString =
	(color: ColorInput) =>
	(...text: unknown[]): string => {
		return bunColor(color, 'ansi') + text.join(' ') + colors.reset;
	};

export const colors = {
	red: colorString('#ef5454'),
	orange: colorString('#ef8354'),
	yellow: colorString('#efd554'),
	green: colorString('#70ef54'),
	turquoise: colorString('#54efef'),
	blue: colorString('#5954ef'),
	purple: colorString('#a454ef'),
	pink: colorString('#ef54d5'),
	gray: colorString('#888'),
	black: colorString('#000'),
	white: colorString('#fff'),
	reset: '\x1b[0m'
} as const;
