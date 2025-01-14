import { Slide, toast } from "react-toastify";

export function checkForUpdate() {
    fetch("/build-meta.json")
        .then((res) => res.json())
        .then((json) => {
            const buildTimestamp = json.buildTimestamp;

            // clear cache and reload if there's a newer build available
            const cachedAt = localStorage.getItem("cached-at");
            if (cachedAt && parseInt(cachedAt) < buildTimestamp) {
                window.caches.delete("journal-cache");

                localStorage.setItem("cached-at", Date.now().toString());

                toast.success("New build available, reloading in 5 seconds!", {
                    position: "top-right",
                    theme: "dark",
                    transition: Slide,
                });
                setTimeout(() => {
                    window.location.reload();
                }, 5000);
            }
        });
}
