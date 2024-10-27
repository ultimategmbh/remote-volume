# Remote Volume

This small Electron application enables you to control the OS audio volume over a WebSocket connection.

## Features

- Get, set, increase or decrease the audio volume
- Get, mute, unmute or toggle the mute state of the audio volume

The application has an built in feature to poll the system audio values (volume and mute state) - this can be enabled or disabled in the configuration window (you can also define a polling interval).
As soon as something changes, the updated values will be sent out to all connected WebSocket clients.

## Supported OS

- Windows Vista or later
- OSX on Arm & x64
- Linux\*

\*No autostart possible by the software setting - needs to be solved manually!

## Installation

Navigate to the [latest release](https://github.com/leonreucher/remote-volume/releases/latest) and download the corresponding file for your OS. Mac OS users will find a .dmg volume, containing the application. Windows users will find a .exe file which contains an installer.
Linux users will find a .deb file for installation.

## Setup

After installing the application, it will run as a menu bar application. By clicking on the menu bar item, you can either close the application or open the configuration screen.

Inside the configuration screen, you can

- select the port, on which clients can connect to the WebSocket server.
- enable or disable the polling feature and set a polling interval.
- select, wether the application should auto start together with the system.

![Setting Window](/docs/images/setting_window.png)

## Usage

When using [Bitfocus Companion](https://bitfocus.io/companion) you don't need the following information - this is only for people, who would like to integrate the application in another project.

### 1. Set Volume

- **Action**: `setVolume`
- **Description**: Sets the system volume to a specified level.
- **Payload**:

  ```json
  {
    "action": "setVolume",
    "value": <number>  // Volume level (0-100)
  }
  ```

### 2. Get Volume

- **Action**: `getVolume`
- **Description**: Returns the current system volume.
- **Payload**:
  ```json
  {
  	"action": "getVolume"
  }
  ```

### 3. Increase Volume

- **Action**: `increaseVolume`
- **Description**: Increases the system volume by a specified increment.
- **Payload**:
  ```json
  {
  	"action": "increaseVolume",
    "value": <number>  // Increment amount (1-99)
  }
  ```

### 4. Decrease Volume

- **Action**: `decreaseVolume`
- **Description**: Decreases the system volume by a specified decrement.
- **Payload**:
  ```json
  {
  	"action": "decreaseVolume",
    "value": <number>  // Decrement amount (1-99)
  }
  ```

### 5. Mute

- **Action**: `mute`
- **Description**: Mutes the system audio.
- **Payload**:
  ```json
  {
  	"action": "mute"
  }
  ```

### 6. Unmute

- **Action**: `unmute`
- **Description**: Unmutes the system audio.
- **Payload**:
  ```json
  {
  	"action": "unmute"
  }
  ```

### 7. Toggle Mute

- **Action**: `toggleMute`
- **Description**: Toggles the mute state of the system audio.
- **Payload**:
  ```json
  {
  	"action": "toggleMute"
  }
  ```

### 8. Is Muted

- **Action**: `isMuted`
- **Description**: Checks if the system audio is currently muted.
- **Payload**:
  ```json
  {
  	"action": "isMuted"
  }
  ```

## Credits

The main part for controlling the system volume is based on the following project:
https://github.com/LinusU/node-loudness

This application can be controlled by [Bitfocus Companion](https://bitfocus.io/companion)

![Companion Badge](./docs/images/companion_badge.png)
