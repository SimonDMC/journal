"use client";

import "./styles.css";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { enforceAuth, logout, RouteType } from "@/util/auth";
import { getOptions } from "@/util/profile";
import { generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { startAuthentication } from "@simplewebauthn/browser";

export default function Home() {
    const authenticating = useRef(false);
    const router = useRouter();

    useEffect(() => {
        enforceAuth(router, RouteType.Auth2FA);

        async function tryPasskey() {
            try {
                const options = getOptions();

                const optionsJSON = await generateAuthenticationOptions({
                    rpID: window.location.hostname,
                    allowCredentials: [
                        {
                            id: options.passkey.id,
                            transports: options.passkey.transports,
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
                        id: options.passkey.id,
                        publicKey: options.passkey.publicKey,
                        counter: options.passkey.counter,
                        transports: options.passkey.transports,
                    },
                });

                await verifyAuthenticationResponse({
                    response: asseResp,
                    expectedChallenge: optionsJSON.challenge,
                    expectedOrigin: origin,
                    expectedRPID: window.location.hostname,
                    credential: {
                        id: options.passkey.id,
                        // a Uint8Array gets serialized into object format for some reason so
                        // we need to convert it back
                        publicKey: new Uint8Array(Object.values(options.passkey.publicKey)),
                        counter: options.passkey.counter,
                        transports: options.passkey.transports,
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
            sessionStorage.setItem("2fa-authed", "true");
            router.push("/overview");
        }

        if (!authenticating.current) verify();
    }, []);

    return (
        <main className="bioauth">
            <a onClick={() => logout(router)} className="logout-icon">
                <FontAwesomeIcon icon={faArrowRightFromBracket} />
            </a>
        </main>
    );
}
