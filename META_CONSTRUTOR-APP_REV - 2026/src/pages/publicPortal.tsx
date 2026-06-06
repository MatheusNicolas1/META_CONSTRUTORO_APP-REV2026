import { lazy } from "react";

const PublicPortal = lazy(() =>
  import("@/pages/PortalPublico").then((module) => ({
    default: module.default,
  }))
);

export { PublicPortal };
export default PublicPortal;
