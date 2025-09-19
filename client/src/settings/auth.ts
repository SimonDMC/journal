import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    type AuthenticatorTransportFuture,
    type CredentialDeviceType,
} from "@simplewebauthn/server";
import { getUserName, useSettings } from "../state/settings";
import { errorToast, successToast } from "../util/toast";
import { startRegistration } from "@simplewebauthn/browser";

export async function setCodeword(codeword: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeword);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    useSettings.getState().setSetting("data.codeword_hash", hashHex);
    sessionStorage.setItem("journal-secondary-authed", "true");
    successToast("Codeword set successfully.");
}

export function setCodewordMismatched() {
    errorToast("Codewords do not match.");
}

export type Passkey = {
    webAuthnUserID: string;
    id?: string;
    publicKey?: Uint8Array<ArrayBufferLike>;
    counter?: number;
    transports?: AuthenticatorTransportFuture[];
    deviceType?: CredentialDeviceType;
    backedUp?: boolean;
};

// https://simplewebauthn.dev/docs/packages/browser
// https://simplewebauthn.dev/docs/packages/server
//
// Being both the browser and the server obviously defeats the point of passkeys,
// but the point is to make it slightly harder to steal data with physical access
// to a logged-in device
export async function setupPasskey() {
    const optionsJSON = await generateRegistrationOptions({
        rpName: "Journal",
        rpID: window.location.hostname,
        userName: getUserName(),
        attestationType: "none",
        authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
            authenticatorAttachment: "platform",
        },
    });

    const attResp = await startRegistration({ optionsJSON });

    const verification = await verifyRegistrationResponse({
        response: attResp,
        expectedChallenge: optionsJSON.challenge,
        expectedOrigin: origin,
        expectedRPID: window.location.hostname,
    });

    const newPasskey: Passkey = {
        webAuthnUserID: optionsJSON.user.id,
        id: verification.registrationInfo?.credential.id,
        publicKey: verification.registrationInfo?.credential.publicKey,
        counter: verification.registrationInfo?.credential.counter,
        transports: verification.registrationInfo?.credential.transports,
        deviceType: verification.registrationInfo?.credentialDeviceType,
        backedUp: verification.registrationInfo?.credentialBackedUp,
    };

    useSettings.getState().setSetting("data.passkey", newPasskey);
    sessionStorage.setItem("journal-secondary-authed", "true");
}
