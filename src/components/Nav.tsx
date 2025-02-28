import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { Spinner, useMediaQuery } from "@geist-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "react-feather";
import useContract from "../hooks/useContract";
import Link from "next/link";
import Button from "./Button";
import Logo from "./Logo";
import Partners from "../partners";
import styles from "../styles/components/Nav.module.sass";

const Nav = () => {
  const router = useRouter();
  const [hasWallet, setHasWallet] = useState(false);
  const [connected, setConnected] = useState(false);
  const [menuState, setMenuState] = useState<"chains" | "gov" | null>(null);
  const [hoveredPopup, setHoveredPopup] = useState(false);

  const base = router.asPath.split(router.pathname)[0];

  const govMenu = useRef<HTMLDivElement>(null);
  const chainsMenu = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState(0);
  const [hoveredChain, setHoveredChain] = useState<string>();

  const { loading, state, height } = useContract();

  const isMobile = useMediaQuery("mobile");
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);

  useEffect(() => {
    const current = menuState === "gov" ? govMenu.current : chainsMenu.current;
    if (!menuState || !current) return;
    const popupWidth = popup.current?.clientWidth ?? 0;
    const updatePos =
      current.offsetLeft + current.clientWidth / 2 - popupWidth / 2;

    if (popupPos !== updatePos) setPopupPos(updatePos);
  }, [menuState, popup]);

  useEffect(() => {
    if (window.arweaveWallet) {
      tryToConnect();
    } else {
      addEventListener("arweaveWalletLoaded", tryToConnect);
    }
  }, []);

  async function tryToConnect() {
    setHasWallet(true);
    const permissions = await window.arweaveWallet.getPermissions();
    if (
      permissions.indexOf("ACCESS_ADDRESS") > -1 &&
      permissions.indexOf("SIGN_TRANSACTION") > -1
    ) {
      setConnected(true);
    }
  }

  async function login() {
    if (!hasWallet) return window.open("https://arconnect.io");
    if (connected) {
      // @ts-ignore
      await window.arweaveWallet.disconnect();
      setConnected(false);
    } else {
      try {
        await window.arweaveWallet.connect([
          "ACCESS_ADDRESS",
          "SIGN_TRANSACTION",
        ]);
        setConnected(true);
      } catch {}
    }
  }

  return (
    <div className={styles.Nav}>
      <Link href="/">
        <a className={styles.Title}>
          <KyveLogo />
        </a>
      </Link>
      <div
        className={styles.Menu}
        onMouseEnter={() => setHoveredPopup(true)}
        onMouseLeave={() => {
          setHoveredPopup(false);
          setMenuState(null);
          setHoveredChain(undefined);
        }}
      >
        <span
          className={styles.Item}
          onMouseEnter={() => setMenuState("chains")}
          onMouseLeave={() => {
            if (!hoveredPopup) setMenuState(null);
          }}
          ref={chainsMenu}
        >
          Chains
        </span>
        <span
          className={styles.Item}
          onMouseEnter={() => setMenuState("gov")}
          onMouseLeave={() => {
            if (!hoveredPopup) setMenuState(null);
          }}
          ref={govMenu}
        >
          Governance
        </span>
        <AnimatePresence>
          {menuState && (
            <motion.div
              className={styles.MenuPopup}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.23, ease: "easeInOut" }}
              ref={popup}
              style={{ left: popupPos }}
            >
              {(menuState === "gov" && (
                <div className={styles.Gov}>
                  <div className={styles.Links}>
                    <Link href="/gov/tokens">
                      <a>
                        Tokens
                        <span>
                          {Object.keys(state.balances || {})
                            .map((addr) => state.balances[addr])
                            .reduce((a, b) => a + b, 0)}{" "}
                          $KYVE
                        </span>
                      </a>
                    </Link>
                    <Link href="/gov/pools">
                      <a>
                        Pools
                        <span>{state.pools.length} Pools</span>
                      </a>
                    </Link>
                    <Link href="/gov/vault">
                      <a>
                        Vault
                        <span>
                          {Object.keys(state.vault || {})
                            .map((addr) => state.vault[addr])
                            .reduce((a, b) => a + b, 0)}{" "}
                          $KYVE
                        </span>
                      </a>
                    </Link>
                  </div>
                  <div className={styles.LatestArweaveBlock}>
                    Block:
                    <a
                      href={`https://viewblock.io/arweave/block/${height}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {height}
                    </a>
                    <Spinner />
                  </div>
                </div>
              )) || (
                <div className={styles.Chains}>
                  <div className={styles.Links}>
                    {Partners.map((partner, i) => (
                      <a
                        href={partner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={i}
                        onMouseEnter={() => setHoveredChain(partner.name)}
                      >
                        {partner.name}
                        <ExternalLink />
                      </a>
                    ))}
                  </div>
                  <motion.div
                    className={styles.CurrentLogo}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    key={hoveredChain}
                  >
                    {(hoveredChain && (
                      <Logo
                        name={
                          Partners.find(
                            ({ name }) => name === hoveredChain
                          )?.name?.toLowerCase() ?? ""
                        }
                      />
                    )) || <KyveLogo />}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!isMobile && (
        <Button buttonSize="small" onClick={login}>
          {hasWallet
            ? connected
              ? "Disconnect"
              : "Connect"
            : "Install ArConnect"}
        </Button>
      )}
      {isMobile && (
        <span
          className={
            styles.MobileMenuButton +
            " " +
            (mobileMenuOpened ? styles.OpenedMenu : "")
          }
          onClick={() => setMobileMenuOpened((val) => !val)}
        >
          <span className={styles.MenuButtonLine} />
          <span className={styles.MenuButtonLine} />
          <AnimatePresence>
            {state && mobileMenuOpened && (
              <motion.div
                className={styles.MobileMenu}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.23, ease: "easeInOut" }}
              >
                <Link href="/gov/tokens">
                  <a>
                    Tokens
                    <span>
                      {Object.keys(state.balances || {})
                        .map((addr) => state.balances[addr])
                        .reduce((a, b) => a + b, 0)}{" "}
                      $KYVE
                    </span>
                  </a>
                </Link>
                <Link href="/gov/pools">
                  <a>
                    Pools
                    <span>{state.pools.length} Pools</span>
                  </a>
                </Link>
                <Link href="/gov/vault">
                  <a>
                    Vault
                    <span>
                      {Object.keys(state.vault || {})
                        .map((addr) =>
                          state.vault[addr]
                            .map((element) => element.amount)
                            .reduce((a, b) => a + b, 0)
                        )
                        .reduce((a, b) => a + b, 0)}{" "}
                      $KYVE
                    </span>
                  </a>
                </Link>
                <Button buttonSize="small" onClick={login}>
                  {hasWallet
                    ? connected
                      ? "Disconnect"
                      : "Connect"
                    : "Install ArConnect"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </span>
      )}
    </div>
  );
};

export default Nav;

const KyveLogo = () => (
  <svg
    height="45"
    viewBox="0 0 1510 350"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M66 350H-9.49949e-08L74.5 -2.38419e-05H140.5L110 143.5H122L235 -2.38419e-05H312V5.99999L179 172V181L263 347V350H190L117 206.5H96L66 350ZM740.152 5.99999L595.152 227H580.152L554.152 350H488.152L514.152 227H499.152L444.152 -2.38419e-05H514.152L552.152 167H561.152L668.152 -2.38419e-05H740.152V5.99999ZM844.305 -2.38419e-05H911.305L922.805 317H931.805L1066.3 -2.38419e-05H1135.3V5.99999L984.305 350H861.305L844.305 -2.38419e-05ZM1229.46 344L1302.46 -2.38419e-05H1509.96V63H1354.96L1337.96 143H1473.46V206H1324.46L1307.46 287H1454.96V350H1229.46V344Z"
      fill="#F5F5F5"
    />
  </svg>
);
