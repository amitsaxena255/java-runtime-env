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
        
        // Push telemetry directly to Google Analytics
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
            window.gtag('event', eventName, properties);
        }
    }

    getEvents() {
        return [...this.events];
    }
}

export const telemetry = new Telemetry();
