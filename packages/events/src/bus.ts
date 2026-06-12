import Redis from "ioredis";

import type { BusEvents } from "./index";

type BusHandler<K extends keyof BusEvents> = (payload: BusEvents[K]) => void;

// Thin typed wrapper over Redis Pub/Sub for cross-service events. ioredis needs
// a dedicated connection in subscribe mode (it can't run other commands there),
// so pub and sub are separate clients.
export class EventBus {
  private readonly pub: Redis;
  private readonly sub: Redis;
  private readonly handlers = new Map<string, Set<(payload: unknown) => void>>();

  constructor(redisUrl: string) {
    this.pub = new Redis(redisUrl);
    this.sub = new Redis(redisUrl);
    this.sub.on("message", (channel: string, message: string) => {
      const set = this.handlers.get(channel);
      if (!set) {
        return;
      }
      const payload: unknown = JSON.parse(message);
      for (const handler of set) {
        handler(payload);
      }
    });
  }

  async publish<K extends keyof BusEvents>(event: K, payload: BusEvents[K]): Promise<void> {
    await this.pub.publish(event, JSON.stringify(payload));
  }

  async subscribe<K extends keyof BusEvents>(event: K, handler: BusHandler<K>): Promise<void> {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
      await this.sub.subscribe(event);
    }
    set.add(handler as (payload: unknown) => void);
  }

  async close(): Promise<void> {
    await Promise.all([this.pub.quit(), this.sub.quit()]);
  }
}
