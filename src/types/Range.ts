// https://github.com/microsoft/TypeScript/issues/43505
type Range<
	START extends number,
	END extends number,
	ARR extends unknown[] = [],
	ACC extends number = never
> = ARR['length'] extends END
	? ACC | START | END
	: Range<START, END, [...ARR, 1], ARR[START] extends undefined ? ACC : ACC | ARR['length']>;

type KeyRange = Range<2, 32>;

export type { Range, KeyRange };
