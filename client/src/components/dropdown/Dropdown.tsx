import "./Dropdown.css";
import { motion } from "framer-motion";

export default function Dropdown(props: { children?: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.2 }}
            className="dropdown"
        >
            {props.children}
        </motion.div>
    );
}
