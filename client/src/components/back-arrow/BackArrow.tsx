import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useRouter } from "@tanstack/react-router";

export default function BackArrow() {
    const router = useRouter();

    return (
        <Link
            to="/overview"
            /* no better way via tanstack router as far as i'm aware */
            onClick={(e) => {
                e.preventDefault();
                router.history.back();
                return false;
            }}
            className="back-arrow"
        >
            <FontAwesomeIcon icon={faArrowLeft} />
        </Link>
    );
}
