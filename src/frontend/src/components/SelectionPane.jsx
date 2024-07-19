import React, { useState, useRef } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";
import Tooltip from "@mui/material/Tooltip";
import { previewTts } from "../../renderer";

const SelectionPane = ({
  ttsText,
  setTtsText,
  voices,
  selectedVoice,
  setSelectedVoice,
}) => {
  const [audioSrc, setAudioSrc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const audioEl = useRef(null);
  const aRef = useRef(null);
  const handleText = (e, v) => {
    setTtsText(e.target.value);
    if (audioSrc !== "") {
      setAudioSrc("");
    }
  };

  const handleVoiceChange = (e, n, action) => {
    if (action === "clear") {
      setSelectedVoice({});
    } else {
      setSelectedVoice(n);
    }
    if (audioSrc !== "") {
      setAudioSrc("");
    }
  };

  const handlePreview = async (e) => {
    if (isLoading || !selectedVoice.voiceId || ttsText === "") {
      return;
    }

    setAudioSrc("");
    setIsLoading(true);

    const filePath = await previewTts(ttsText, selectedVoice.voiceId);

    setAudioSrc(filePath.data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (isLoading || isSaving || audioSrc === "") {
      return;
    }

    setIsSaving(true);

    const src = audioEl.current.src;

    try {
      const response = await fetch(src);
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const filename = `${selectedVoice.name} - ${ttsText
        .split(" ")
        .filter((el, i) => i < 4)
        .join(" ")}.mp3`;
      aRef.current.href = url;
      aRef.current.download = filename;
      aRef.current.click();

      URL.revokeObjectURL(url);
      setIsSaving(false);
    } catch (error) {
      console.error("Error saving the file:", error);
      setIsSaving(false);
    }
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
    buttonParent: {
      width: "49%",
    },
    button: {
      width: "100%",
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
        <Tooltip
          title={
            !selectedVoice.voiceId
              ? "Select a voice"
              : ttsText === ""
              ? "Input text"
              : "Generate preview"
          }
        >
          <Box sx={styles.buttonParent}>
            <Button
              variant="contained"
              sx={styles.button}
              disabled={!selectedVoice.voiceId || ttsText === ""}
              color={isLoading ? "error" : "primary"}
              onClick={handlePreview}
            >
              {isLoading ? "Loading" : "Preview"}
            </Button>
          </Box>
        </Tooltip>
        <Tooltip
          title={audioSrc === "" ? "Generate a preview" : "Click to save"}
        >
          <Box sx={styles.buttonParent}>
            <Button
              variant="contained"
              sx={styles.button}
              disabled={audioSrc === ""}
              color={isSaving ? "error" : "primary"}
              onClick={handleSave}
            >
              {isSaving ? "Saving" : "Save"}
            </Button>
          </Box>
        </Tooltip>
      </Box>
      <Grow in={audioSrc !== ""}>
        <Box sx={styles.audioBox}>
          <audio
            ref={audioEl}
            controls
            disabled={audioSrc === ""}
            src={audioSrc}
          ></audio>
        </Box>
      </Grow>
      <a ref={aRef} style={{ display: "none" }}></a>
    </>
  );
};

export default SelectionPane;
