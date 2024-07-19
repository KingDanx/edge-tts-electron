import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";

const SelectionPane = ({ ttsText, setTtsText, voices, setSelectedVoice }) => {
  const [audioSrc, setAudioSrc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const handleText = (e, v) => {
    e.preventDefault();
    setTtsText(e.target.value);
  };

  console.log(voices);

  const handleVoiceChange = (e, n, action) => {
    if (action === "clear") {
      setSelectedVoice({});
    } else {
      setSelectedVoice(n);
    }
  };

  const handlePreview = (e) => {
    if (isLoading) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
  };

  const options = Array.isArray(voices)
    ? voices
        .map((voice) => {
          const language = voice.language;
          return {
            language: /[0-9]/.test(language) ? "0-9" : language,
            ...voice,
          };
        })
        .sort((a, b) => -b.name.localeCompare(a.name))
    : [];

  const styles = {
    textField: {
      width: "95%",
      mt: 1,
    },
    buttonBox: {
      display: "flex",
      justifyContent: "space-between",
      width: "95%",
      mt: 1,
    },
    button: {
      width: "49%",
    },
    audioBox: {
      mt: 1,
      width: "95%",
    },
  };

  return (
    <>
      <Autocomplete
        sx={styles.textField}
        options={options.sort((a, b) => -b.language.localeCompare(a.language))}
        groupBy={(option) => option.language}
        getOptionLabel={(option) => `${option.language} - ${option.name}`}
        renderInput={(params) => <TextField {...params} label="Select Voice" />}
        onChange={handleVoiceChange}
      />
      <TextField
        onChange={handleText}
        sx={styles.textField}
        color="action"
        label="TTS Text"
        value={ttsText}
        multiline
        variant="filled"
        rows={10}
      />
      <Box sx={styles.buttonBox}>
        <Button
          variant="contained"
          sx={styles.button}
          color={isLoading ? "error" : "primary"}
          onClick={handlePreview}
        >
          {isLoading ? "Loading" : "Preview"}
        </Button>
        <Button
          variant="contained"
          sx={styles.button}
          color={isSaving ? "error" : "primary"}
        >
          {isSaving ? "Saving" : "Save"}
        </Button>
      </Box>
      <Grow in={audioSrc !== ""}>
        <Box sx={styles.audioBox}>
          <audio controls src={audioSrc}></audio>
        </Box>
      </Grow>
    </>
  );
};

export default SelectionPane;
