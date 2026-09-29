import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useRouter } from "@tanstack/react-router";

export default function BackArrow(props: { clickAction?: () => Promise<void> }) {
    const router = useRouter();

    return (
        <Link
            to="/overview"
            /* no better way via tanstack router as far as i'm aware */
            onClick={(e) => {
                e.preventDefault();
                // if we have a click action, run it
                props.clickAction?.();
                router.history.back();
                return false;
            }}
            className="back-arrow"
        >
            <FontAwesomeIcon icon={faArrowLeft} />
        </Link>
    );
}
