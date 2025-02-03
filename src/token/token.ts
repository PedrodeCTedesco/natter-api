import { Instant } from "@js-joda/core";

export class Token {
    public readonly expiry: Instant;
    public readonly username: string;
    public readonly attributes: Map<string, any>;

    constructor(expiry: Instant, username: string) {
        this.expiry = expiry;
        this.username = username;
        this.attributes = new Map<string, any>();
    }
}