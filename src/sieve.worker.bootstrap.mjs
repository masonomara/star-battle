import { register } from 'tsx/esm/api';
register();
await import('./sieve.worker.ts');
