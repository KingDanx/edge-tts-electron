import { useState, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Header from "./components/Header";
import SelectionPane from "./components/SelectionPane";
import Box from "@mui/material/Box";
import { getVoices } from "../renderer";
import "./App.css";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState({});
  const [ttsText, setTtsText] = useState("");

  useEffect(() => {
    getVoices()
      .then((d) => setVoices(d.data))
      .catch((e) => console.log(e));
  }, []);

  const styles = {
    parent: {
      display: "grid",
      width: "100%",
    },
    child: {
      width: "50%",
    },
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <>
        <Header />
        <Box sx={styles.parent}>
          <Box sx={styles.child}>
            <SelectionPane
              ttsText={ttsText}
              setTtsText={setTtsText}
              voices={voices}
              setSelectedVoice={setSelectedVoice}
            />
          </Box>
        </Box>
      </>
    </ThemeProvider>
  );
}

export default App;
