import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./page";
import Overview from "./overview";
import Login from "./login";
import { Slide, ToastContainer } from "react-toastify";
import Entry from "./entry";

const root = document.getElementById("root");

createRoot(root!).render(
    <>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/entry" element={<Entry />} />
            </Routes>
        </BrowserRouter>
        <ToastContainer transition={Slide} />
    </>
);
