import { createRoot } from "react-dom/client";
import { AppRouter } from "./main/routes/browserRoutes";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<AppRouter />);
