import { windowAction } from "../../renderer";
import "../../styles/Header.css";
import Icon from "../assets/icon128.png";
import MinimizeIcon from "@mui/icons-material/Minimize";
import MaximizeIcon from "@mui/icons-material/FilterNone";
import CloseIcon from "@mui/icons-material/Close";

const Header = () => {
  const handleClick = (action) => {
    windowAction(action);
  };

  const styles = {
    icon: {
      borderRadius: 1,
      p: 0.5,
      m: 0.5,
      transition: "background 0.25s linear",
      "&:hover": {
        background: "crimson",
      },
    },
  };

  return (
    <div className="parent">
      <div className="header">
        <img src={Icon} alt="" height={50} width={50} />
      </div>
      <div className="icon-parent">
        <MinimizeIcon
          sx={styles.icon}
          onClick={() => handleClick("minimize-window")}
        />
      </div>
      <div className="icon-parent">
        <MaximizeIcon
          sx={styles.icon}
          onClick={() => handleClick("maximize-window")}
        />
      </div>
      <div className="icon-parent">
        <CloseIcon
          sx={styles.icon}
          onClick={() => handleClick("close-window")}
        />
      </div>
    </div>
  );
};

export default Header;
