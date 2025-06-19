// you can bind whatever events and listeners to this guy!
export const eventTarget = new EventTarget();

type UpdateReadyDetail = {
    version: string;
    changelogs: string[];
};

export class UpdateReadyEvent extends CustomEvent<UpdateReadyDetail> {
    constructor(detail: UpdateReadyDetail) {
        super("update-ready", { detail });
    }
}

type QuoteImageOpenDetail = {
    content: string;
};

export class QuoteImageOpenEvent extends CustomEvent<QuoteImageOpenDetail> {
    constructor(detail: QuoteImageOpenDetail) {
        super("quote-image-open", { detail });
    }
}
