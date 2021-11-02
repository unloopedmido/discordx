/* eslint-disable @typescript-eslint/no-explicit-any */
import WebSocket = require("ws");
import {
  BaseNodeOptions,
  Track,
  TrackInfo,
  TrackResponse,
  VoiceServerUpdate,
  VoiceStateUpdate,
} from "../types";
import Connection from "../core/Connection";
import { EventEmitter } from "events";
import Http from "../core/Http";
import PlayerStore from "../core/PlayerStore";

export default abstract class BaseNode extends EventEmitter {
  public abstract send: (guildId: string, packet: any) => Promise<any>;

  public password: string;
  public userID: string;
  public shardCount?: number;

  public connection?: Connection;
  public players: PlayerStore<this> = new PlayerStore(this);
  public http?: Http;

  public voiceStates: Map<string, string> = new Map();
  public voiceServers: Map<string, VoiceServerUpdate> = new Map();

  private _expectingConnection: Set<string> = new Set();

  constructor({ password, userId, shardCount, host }: BaseNodeOptions) {
    super();
    this.password = password;
    this.userID = userId;
    this.shardCount = shardCount;

    this.http = new Http(
      this,
      `http://${host?.rest?.address ?? host?.address ?? "localhost"}:${
        host?.rest?.port ?? host?.port ?? 2333
      }`
    );

    this.connection = new Connection(
      this,
      `ws://${host?.address ?? "localhost"}:${host?.port ?? 2333}`,
      host?.connectionOptions
    );
  }

  public get connected(): boolean {
    return this.connection?.ws.readyState === WebSocket.OPEN;
  }

  public load(identifier: string): Promise<TrackResponse> {
    if (this.http) {
      return this.http.load(identifier);
    }
    throw new Error("no available http module");
  }

  public decode(track: string): Promise<TrackInfo>;
  public decode(tracks: string[]): Promise<Track[]>;
  public decode(tracks: string | string[]): Promise<TrackInfo | Track[]> {
    if (this.http) {
      return this.http.decode(tracks);
    }
    throw new Error("no available http module");
  }

  public voiceStateUpdate(packet: VoiceStateUpdate): Promise<boolean> {
    if (packet.user_id !== this.userID) {
      return Promise.resolve(false);
    }

    if (packet.channel_id) {
      this.voiceStates.set(packet.guild_id, packet.session_id);
      return this._tryConnection(packet.guild_id);
    } else {
      this.voiceServers.delete(packet.guild_id);
      this.voiceStates.delete(packet.guild_id);
    }

    return Promise.resolve(false);
  }

  public voiceServerUpdate(packet: VoiceServerUpdate): Promise<boolean> {
    this.voiceServers.set(packet.guild_id, packet);
    this._expectingConnection.add(packet.guild_id);
    return this._tryConnection(packet.guild_id);
  }

  public connect(): void {
    this.connection?.connect();
  }

  public disconnect(code?: number, data?: string): Promise<void> {
    if (this.connection) {
      return this.connection.close(code, data);
    }
    return Promise.resolve();
  }

  public async destroy(code?: number, data?: string): Promise<void> {
    await Promise.all(
      [...this.players.values()].map((player) => player.destroy())
    );
    await this.disconnect(code, data);
  }

  private async _tryConnection(guildId: string): Promise<boolean> {
    const state = this.voiceStates.get(guildId);
    const server = this.voiceServers.get(guildId);
    if (!state || !server || !this._expectingConnection.has(guildId)) {
      return false;
    }

    await this.players.get(guildId).voiceUpdate(state, server);
    this._expectingConnection.delete(guildId);
    return true;
  }
}
