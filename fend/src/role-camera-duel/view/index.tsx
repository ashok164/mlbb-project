import { useRoleCameraDuelController } from "../controller/controller";
import { RoleCameraDuelView } from "./view";

export default function RoleCameraDuelPage() {
  const controller = useRoleCameraDuelController();
  return <RoleCameraDuelView {...controller} />;
}
