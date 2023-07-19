import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, setDoc, getDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDc4UhpglETxXTow3pUKQ2BOMUBlp0a6v4",
    authDomain: "journal-simondmc.firebaseapp.com",
    projectId: "journal-simondmc",
    storageBucket: "journal-simondmc.appspot.com",
    messagingSenderId: "236938473550",
    appId: "1:236938473550:web:88703bd8f3cad80fc9531f",
    measurementId: "G-136DDTFZJW",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// auth
const provider = new GoogleAuthProvider();
export const auth = getAuth();

// login
export const login = async () => {
    const result = await signInWithPopup(auth, provider);
    if (!result) return;

    // get user from signin
    const user = result.user;
    // if user does not have a document in the users collection, create one
    const docRef = doc(db, "main", `${user.uid}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return;
    await setDoc(doc(db, "main", `${user.uid}`), {
        name: user.displayName,
        email: user.email,
        joined: new Date(),
        entries: {},
    });
};

// logout
export const logout = () => {
    auth.signOut();
};

// get journal entry
export const getEntry = async (date: string) => {
    const user = auth.currentUser;
    if (!user) console.log("no user");
    if (!user) return false;
    const userRef = doc(db, "main", `${user.uid}`);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) return false;
    return docSnap.data().entries[date].text;
};

// save journal entry
export const saveEntry = async (entry: string, date: string) => {
    const user = auth.currentUser;
    if (!user) return false;
    const userRef = doc(db, "main", `${user.uid}`);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) return false;
    await setDoc(userRef, {
        ...docSnap.data(),
        entries: {
            ...docSnap.data().entries,
            [date]: {
                text: entry,
                lastEdited: new Date(),
            },
        },
    });
    return true;
};
