import { MONTH_NAMES } from "../../util/months";
import { getUserName } from "../../util/profile";
import { Plugin, ButtonView } from "ckeditor5";

export class QuoteButton extends Plugin {
    init() {
        const editor = this.editor;
        // The button must be registered among the UI components of the editor
        // to be displayed in the toolbar.
        editor.ui.componentFactory.add("quote", () => {
            // The button will be an instance of ButtonView.
            const button = new ButtonView();

            button.set({
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M6.5 10c-.223 0-.437.034-.65.065c.069-.232.14-.468.254-.68c.114-.308.292-.575.469-.844c.148-.291.409-.488.601-.737c.201-.242.475-.403.692-.604c.213-.21.492-.315.714-.463c.232-.133.434-.28.65-.35l.539-.222l.474-.197l-.485-1.938l-.597.144c-.191.048-.424.104-.689.171c-.271.05-.56.187-.882.312c-.318.142-.686.238-1.028.466c-.344.218-.741.4-1.091.692c-.339.301-.748.562-1.05.945c-.33.358-.656.734-.909 1.162c-.293.408-.492.856-.702 1.299c-.19.443-.343.896-.468 1.336c-.237.882-.343 1.72-.384 2.437c-.034.718-.014 1.315.028 1.747c.015.204.043.402.063.539l.025.168l.026-.006A4.5 4.5 0 1 0 6.5 10m11 0c-.223 0-.437.034-.65.065c.069-.232.14-.468.254-.68c.114-.308.292-.575.469-.844c.148-.291.409-.488.601-.737c.201-.242.475-.403.692-.604c.213-.21.492-.315.714-.463c.232-.133.434-.28.65-.35l.539-.222l.474-.197l-.485-1.938l-.597.144c-.191.048-.424.104-.689.171c-.271.05-.56.187-.882.312c-.317.143-.686.238-1.028.467c-.344.218-.741.4-1.091.692c-.339.301-.748.562-1.05.944c-.33.358-.656.734-.909 1.162c-.293.408-.492.856-.702 1.299c-.19.443-.343.896-.468 1.336c-.237.882-.343 1.72-.384 2.437c-.034.718-.014 1.315.028 1.747c.015.204.043.402.063.539l.025.168l.026-.006A4.5 4.5 0 1 0 17.5 10"/></svg>`,
                tooltip: "Generate quote image",
            });

            button.on("execute", () => {
                document.getElementById("quoteImageBg")?.classList.add("visible");
                const quoteHTML = editor.data.stringify(editor.model.getSelectedContent(editor.model.document.selection));
                document.getElementById("quoteText")!.innerHTML = quoteHTML;
                document.getElementById("quoteCredit")!.innerText = `– ${getUserName()}`;

                const date = new URLSearchParams(window.location.search).get("date");
                const year = parseInt(date!.substring(0, 4));
                const month = parseInt(date!.substring(5, 7));
                const day = parseInt(date!.substring(8, 10));
                document.getElementById("quoteDate")!.innerText = `${MONTH_NAMES[month - 1]} ${day}, ${year}`;

                document.getSelection()?.removeAllRanges();
                (document.activeElement as HTMLInputElement).blur();
            });

            return button;
        });
    }
}
