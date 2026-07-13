import { test } from '@playwright/test';

export const given = <T>(title: string, fn: () => Promise<T> | T) => test.step(`Given ${title}`, fn);

export const when = <T>(title: string, fn: () => Promise<T> | T) => test.step(`When ${title}`, fn);

export const then = <T>(title: string, fn: () => Promise<T> | T) => test.step(`Then ${title}`, fn);
