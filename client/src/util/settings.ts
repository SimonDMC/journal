import type { Dispatch, SetStateAction } from "react";
import { errorToast } from "./toast";
import { getUserName } from "./profile";
import {
    type AuthenticatorTransportFuture,
    type CredentialDeviceType,
    generateRegistrationOptions,
    verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { startRegistration } from "@simplewebauthn/browser";

export type Settings = {
    "2fa_method"?: number;
    codeword?: string;
    passkey?: Passkey;
};

export type Passkey = {
    webAuthnUserID: string;
    id?: string;
    publicKey?: Uint8Array<ArrayBufferLike>;
    counter?: number;
    transports?: AuthenticatorTransportFuture[];
    deviceType?: CredentialDeviceType;
    backedUp?: boolean;
};

function saveSettings(settings: Settings) {
    localStorage.setItem(`journal-options-${getUserName()}`, JSON.stringify(settings));
}

export function switch2fa(settings: Settings, setSettings: Dispatch<SetStateAction<Settings>>) {
    const newOptions = { ...settings };
    newOptions["2fa_method"] = ((newOptions["2fa_method"] ?? 0) + 1) % 3;
    setSettings(newOptions);
    saveSettings(newOptions);
    sessionStorage.setItem("journal-2fa-authed", "true");
}

export async function setCodeword(settings: Settings, setSettings: Dispatch<SetStateAction<Settings>>) {
    if (!confirm("You won't be able to access Journal if you forget the codeword you set. \nAre you sure you want to continue?")) return;

    const codeword = prompt("Set a new codeword:");
    if (!codeword) return;

    const codewordVerify = prompt("Confirm codeword:");
    if (codeword != codewordVerify) {
        errorToast("Codewords did not match. No codeword has been set.");
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(codeword);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const newSettings = { ...settings };
    newSettings.codeword = hashHex;
    setSettings(newSettings);
    saveSettings(newSettings);
    sessionStorage.setItem("journal-2fa-authed", "true");
}

// https://simplewebauthn.dev/docs/packages/browser
// https://simplewebauthn.dev/docs/packages/server
//
// Being both the browser and the server obviously defeats the point of passkeys,
// but the point is to make it slightly harder to steal data with physical access
// to a logged-in device
export async function setupBioAuth(settings: Settings, setSettings: Dispatch<SetStateAction<Settings>>) {
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

    const newSettings = { ...settings };
    newSettings.passkey = newPasskey;
    setSettings(newSettings);
    saveSettings(newSettings);
    sessionStorage.setItem("journal-2fa-authed", "true");
}
