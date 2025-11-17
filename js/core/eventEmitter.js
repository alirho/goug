/**
 * A simple event emitter class for implementing the pub/sub pattern.
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribes a listener function to an event.
     * @param {string} eventName - The name of the event.
     * @param {Function} listener - The callback function to execute.
     */
    on(eventName, listener) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);
    }

    /**
     * Unsubscribes a listener function from an event.
     * @param {string} eventName - The name of the event.
     * @param {Function} listenerToRemove - The specific callback function to remove.
     */
    off(eventName, listenerToRemove) {
        if (!this.events[eventName]) {
            return;
        }
        this.events[eventName] = this.events[eventName].filter(
            listener => listener !== listenerToRemove
        );
    }

    /**
     * Emits an event, calling all subscribed listeners with the provided data.
     * Errors in one listener will not prevent others from being called.
     * @param {string} eventName - The name of the event to emit.
     * @param {*} data - The data to pass to the listeners.
     */
    emit(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`Error in listener for event "${eventName}":`, error);
                }
            });
        }
    }

    /**
     * Removes all listeners for all events.
     */
    destroy() {
        this.events = {};
    }
}

export default EventEmitter;