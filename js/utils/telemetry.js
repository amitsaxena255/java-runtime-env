import { logger } from './logger.js';

class Telemetry {
    constructor() {
        this.events = [];
    }

    track(eventName, properties = {}) {
        const event = {
            name: eventName,
            properties,
            timestamp: new Date().toISOString()
        };
        this.events.push(event);
        logger.debug(`[Telemetry] Tracked event: ${eventName}`, properties);
        
        // In a real production app, we would batch and send these to a backend
    }

    getEvents() {
        return [...this.events];
    }
}

export const telemetry = new Telemetry();
