import {env} from 'cloudflare:workers';
export function workspaceDb(){if(!env.DB)throw new Error('DB unavailable');return env.DB;}
