// useRoleRedirect.ts
import { useNavigate } from "react-router-dom";


export function useRoleRedirect() {
  const navigate = useNavigate();

  return (role: string) => {
    switch (role) {
      case "client":
        navigate("/customer", { replace: true });
        break;
      case "admin":
        navigate("/admin", { replace: true });
        break;
      case "fournisseur":
        navigate("/supplier", { replace: true });
        break;
      case "gerant_depot":
        navigate("/depot-manager", { replace: true });
        break;
      default:
        navigate("/", { replace: true });
    }
  };
}
