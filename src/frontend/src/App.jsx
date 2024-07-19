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
      .catch((e) => {
        setVoices([]);
        console.log(e);
      });
  }, []);

  const styles = {
    parent: {
      display: "grid",
      justifyItems: "center",
      width: "100%",
    },
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <>
        <Header />
        <Box sx={styles.parent}>
          <SelectionPane
            ttsText={ttsText}
            setTtsText={setTtsText}
            voices={voices}
            setSelectedVoice={setSelectedVoice}
            selectedVoice={selectedVoice}
          />
        </Box>
      </>
    </ThemeProvider>
  );
}

export default App;
