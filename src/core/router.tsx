import { Navigate, RouteObject } from "react-router-dom";
import { AppConfig } from "../Infraestructure/AppConfig";

import { AuthWrapper } from "@variamosple/variamos-components";
import ExperimentPage from "../UI/WorkSpace/DashBoard";

export const ROUTES: RouteObject[] = [
  {
    path: "/",
    children: [
      {
        index: true,
        element: (
          <AuthWrapper redirectPath={AppConfig.LOGIN_URL}>
            <ExperimentPage />
          </AuthWrapper>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];
