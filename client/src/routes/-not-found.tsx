import "../styles/not-found.css";

export function NotFound() {
    return (
        <main className="not-found">
            <div className="container">
                <div className="page-not-found">Page not found</div>
                <a href="/" className="home-btn">
                    Back
                </a>
            </div>
        </main>
    );
}
