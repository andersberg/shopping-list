import { z } from 'zod';

export const idString = z.string().cuid2();

export const nameString = z.string().min(2);
