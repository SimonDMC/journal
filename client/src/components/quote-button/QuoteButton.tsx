import { Plugin, ButtonView } from "ckeditor5";
import { QuoteStartIcon } from "../icons/QuoteStartIcon";
import { renderToString } from "react-dom/server";
import { eventTarget, QuoteImageOpenEvent } from "../../util/events";

export class QuoteButton extends Plugin {
    init() {
        const editor = this.editor;
        // The button must be registered among the UI components of the editor
        // to be displayed in the toolbar.
        editor.ui.componentFactory.add("quote", () => {
            // The button will be an instance of ButtonView.
            const button = new ButtonView();

            button.set({
                // super cursed usage of a server-only API but who cares. it works and deduplicates code!
                icon: renderToString(<QuoteStartIcon />).replace(`viewBox="0 0 32 32"`, `viewBox="0 0 24 24"`),
                tooltip: "Generate quote image",
            });

            button.on("execute", () => {
                eventTarget.dispatchEvent(
                    new QuoteImageOpenEvent({
                        content: editor.data.stringify(editor.model.getSelectedContent(editor.model.document.selection)),
                    })
                );

                document.getSelection()?.removeAllRanges();
                (document.activeElement as HTMLInputElement).blur();
            });

            return button;
        });
    }
}
