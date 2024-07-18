import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

const SelectionPane = ({ ttsText, setTtsText, voices, setSelectedVoice }) => {
  const handleText = (e, v) => {
    e.preventDefault();
    setTtsText(e.target.value);
  };

  const handleVoiceChange = (e, n, action) => {
    if (action === "clear") {
      setSelectedVoice({});
    } else {
      setSelectedVoice(n);
    }
  };

  const options = voices
    .map((voice) => {
      const language = voice.language;
      return {
        language: /[0-9]/.test(language) ? "0-9" : language,
        ...voice,
      };
    })
    .sort((a, b) => -b.name.localeCompare(a.name));

  const styles = {
    textField: {
      width: "100%",
      mt: 1,
    },
  };

  return (
    <>
      <Autocomplete
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
        maxRows={10}
        rows={10}
      />
    </>
  );
};

export default SelectionPane;
