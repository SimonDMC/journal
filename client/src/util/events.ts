// you can bind whatever events and listeners to this guy!
export const eventTarget = new EventTarget();

type UpdateReadyDetail = {
    version: string;
    changelogs: string[];
    updateMode: string;
};

export class UpdateReadyEvent extends CustomEvent<UpdateReadyDetail> {
    static eventId = "update-ready";
    constructor(detail: UpdateReadyDetail) {
        super(UpdateReadyEvent.eventId, { detail });
    }
}

type QuoteImageOpenDetail = {
    content: string;
};

export class QuoteImageOpenEvent extends CustomEvent<QuoteImageOpenDetail> {
    static eventId = "quote-image-open";
    constructor(detail: QuoteImageOpenDetail) {
        super(QuoteImageOpenEvent.eventId, { detail });
    }
}

export class OfflineModeEvent extends Event {
    static eventId = "offline-mode";
    constructor() {
        super(OfflineModeEvent.eventId);
    }
}

export class CloseOpenPopupEvent extends Event {
    static eventId = "close-open-popup";
    constructor() {
        super(CloseOpenPopupEvent.eventId);
    }
}
