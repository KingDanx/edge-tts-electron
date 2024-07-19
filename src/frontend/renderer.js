//? This file acts as a connection point between the frontend (loaded in a script tag in ../js/console.js) and the backend (../../../main.js).
//? These functions are able to communicate to main.js because of the context bridge set up in ../../../preload.js

//? These are the "REST" functions to trigger main process actions
//? Server functions are in ../../../main.js and have the same name but snake case
//? Example: serverStatus() here is server_status() in ../../../main.js

export const getVoices = () => {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("getVoices", "getVoices");

    ipcRenderer.once("getVoices", (response) => {
      try {
        resolve(response);
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
  });
};

export const previewTts = (text, voiceId) => {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("previewTts", { text, voiceId });

    ipcRenderer.once("previewTts", (response) => {
      try {
        console.log(response);
        resolve(response);
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
  });
};

export const windowAction = (action) => {
  ipcRenderer.send(action);
};
