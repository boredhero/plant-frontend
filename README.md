# plant-frontend

React frontend for a live plant camera and garden monitoring dashboard. Shows a real-time HLS video stream from a grow light setup, timelapse archive, and (eventually) sensor readings. Companion to [plant-backend](https://github.com/boredhero/plant-backend).

**Live site:** [planting.martinospizza.dev](https://planting.martinospizza.dev)

## Live Stream Player

The HLS player uses [hls.js](https://github.com/video-dev/hls.js/) with native Safari fallback. The stream comes from an MJPEG webcam on a RockPro64 SBC, transcoded to H.264 HLS via ffmpeg with Intel VAAPI hardware encoding on the server.

### Live Edge Management

A common problem with HLS live streams is the player drifting behind the live edge after brief network hiccups or browser tab backgrounding, then stalling when it tries to load segments that have already been deleted from the rolling window.

The initial approach of seeking to `hls.liveSyncPosition` on every `waiting` event caused a worse problem: a seek-play-stall-seek loop where the player endlessly replayed the same 3 seconds of video. The solution was counterintuitive -- **remove all stall-triggered seeking entirely** and let hls.js handle buffering natively. The only intervention is a passive 5-second watchdog that nudges playback forward if it drifts more than 10 seconds behind live, and unpauses if the browser paused it.

The `backBufferLength` is set to 2 seconds (one segment) so there's almost no stale data for the player to accidentally seek backward into.

## Timelapse Archive

Fetches daily and weekly timelapse videos from the backend API. Videos are served as static MP4s through nginx. The archive section only renders when videos exist -- no empty states cluttering the UI.

## Deployment

Deployed via GitHub Actions on push to `main`. Vite builds the static bundle, which is SCP'd to the server and rsynced into the web root (excluding the `/cam` directory where HLS segments live).

## Development

```bash
npm install
npm run dev
```

## Stack

- React 19, Vite 7, hls.js
- Inline styles using CSS custom properties for theming
- No component library -- everything hand-built to match the existing site aesthetic
