import * as Ably from 'ably';

export type AblyConnection = {
	join: (roomId: string, name: string) => Promise<void>;
	leave: () => Promise<void>;
	publishState: (snapshot: any) => Promise<void>;
	onState: (cb: (snapshot: any) => void) => () => void;
	publishEvent: (event: any) => Promise<void>;
	onEvent: (cb: (event: any) => void) => () => void;
};

let realtime: Ably.Realtime | null = null;
let channel: Ably.Types.RealtimeChannelCallbacks | null = null;
let currentRoom = '';

function getClient(): Ably.Realtime {
	if (!realtime) {
		const key = (import.meta as any).env?.VITE_ABLY_KEY as string | undefined;
		if (!key) throw new Error('VITE_ABLY_KEY missing');
		realtime = new Ably.Realtime({ key, echoMessages: false, recover: 'persist' });
	}
	return realtime;
}

export const AblySync: AblyConnection = {
	async join(roomId: string, name: string) {
		if (!roomId) throw new Error('roomId required');
		const client = getClient();
		currentRoom = roomId;
		channel = client.channels.get(`room:${roomId}`, { params: { rewind: '1' } });
		await new Promise<void>((resolve) => channel!.attach(() => resolve()));
		try { await channel!.presence.enter({ name }); } catch {}
	},
	async leave() {
		try { if (channel) { try { await channel.presence.leave(); } catch {} channel.detach(); } } catch {}
		channel = null; currentRoom = '';
	},
	async publishState(snapshot: any) {
		if (!channel) return;
		await channel.publish('state', snapshot);
	},
	onState(cb: (snapshot: any) => void) {
		if (!channel) return () => {};
		const handler = (msg: Ably.Types.Message) => { try { cb(msg.data); } catch {} };
		channel.subscribe('state', handler);
		return () => { try { channel && channel.unsubscribe('state', handler); } catch {} };
	},
	async publishEvent(event: any) {
		if (!channel) return;
		await channel.publish('event', event);
	},
	onEvent(cb: (event: any) => void) {
		if (!channel) return () => {};
		const handler = (msg: Ably.Types.Message) => { try { cb(msg.data); } catch {} };
		channel.subscribe('event', handler);
		return () => { try { channel && channel.unsubscribe('event', handler); } catch {} };
	}
};

export function isAblyJoined(): boolean { return !!channel && !!currentRoom; }


