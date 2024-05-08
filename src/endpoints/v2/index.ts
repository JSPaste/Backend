import { Hono } from 'hono';
import { Test } from './Test.ts';

export default class V2 {
	public static endpoint = new Hono();

	static {
		Test(V2.endpoint);
	}
}
