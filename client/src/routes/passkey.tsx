import "../styles/bioauth.css";
import { useEffect, useRef } from "react";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { enforceAuth, logout, RouteType } from "../util/auth";
import { generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { startAuthentication } from "@simplewebauthn/browser";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSettings } from "../state/settings";
import type { Passkey } from "../settings/auth";

export const Route = createFileRoute("/passkey")({
    component: Passkey,
});

function Passkey() {
    const authenticating = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        enforceAuth(navigate, RouteType.SecondaryAuth);

        async function tryPasskey() {
            try {
                const passkey = useSettings.getState().getSetting("data.passkey") as Passkey;
                const optionsJSON = await generateAuthenticationOptions({
                    rpID: window.location.hostname,
                    allowCredentials: [
                        {
                            id: passkey.id!,
                            transports: passkey.transports,
                        },
                    ],
                });

                const asseResp = await startAuthentication({ optionsJSON });

                console.log({
                    asseResp,
                    optionsJSONChallenge: optionsJSON.challenge,
                    expectedChallenge: optionsJSON.challenge,
                    expectedOrigin: origin,
                    expectedRPID: window.location.hostname,
                    credential: {
                        id: passkey.id,
                        publicKey: passkey.publicKey,
                        counter: passkey.counter,
                        transports: passkey.transports,
                    },
                });

                await verifyAuthenticationResponse({
                    response: asseResp,
                    expectedChallenge: optionsJSON.challenge,
                    expectedOrigin: origin,
                    expectedRPID: window.location.hostname,
                    credential: {
                        id: passkey.id!,
                        // a Uint8Array gets serialized into object format for some reason so
                        // we need to convert it back
                        publicKey: new Uint8Array(Object.values(passkey.publicKey!)),
                        counter: passkey.counter!,
                        transports: passkey.transports,
                    },
                });

                return true;
            } catch (e) {
                console.log(e);
                return false;
            }
        }

        async function verify() {
            authenticating.current = true;
            // keep trying until we get it
            while (!(await tryPasskey())) {
                await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
            }
            sessionStorage.setItem("journal-secondary-authed", "true");
            navigate({ to: "/overview" });
        }

        if (!authenticating.current) verify();
    }, [navigate]);

    return (
        <main className="bioauth">
            <a onClick={() => logout(navigate)} className="logout-icon">
                <FontAwesomeIcon icon={faArrowRightFromBracket} />
            </a>
        </main>
    );
}
