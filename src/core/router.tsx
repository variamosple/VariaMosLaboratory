import { Navigate, RouteObject } from "react-router-dom";

import { AuthWrapper } from "@variamosple/variamos-components";
import { Config } from "../Config";
import LaboratoryContainer from "../UI/LaboratoryContainer/LaboratoryContainer";

export const ROUTES: RouteObject[] = [
  {
    path: "/",
    children: [
      {
        index: true,
        element: (
          <AuthWrapper redirectPath={Config.LOGIN_URL}>
            <LaboratoryContainer />
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
