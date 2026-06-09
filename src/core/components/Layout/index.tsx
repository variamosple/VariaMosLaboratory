import {
  Footer,
  Header,
  MenuContextProvider,
} from "@variamosple/variamos-components";

import VariaMosLogo from "../../../Addons/images/VariaMosLogo.png";
import { requestMenuConfig } from "../../../DataProvider/Services/configService";
import { AppConfig } from "../../../Infraestructure/AppConfig";

function Layout({ children }) {
  return (
    <>
      <MenuContextProvider requestMenu={requestMenuConfig}>
        <Header
          logoUrl={VariaMosLogo}
          logoAlt="VariaMos logo"
          signInUrl={AppConfig.LOGIN_URL}
        />
      </MenuContextProvider>
      <div>{children}</div>
      <Footer version={AppConfig.VERSION} />
    </>
  );
}

export default Layout;
