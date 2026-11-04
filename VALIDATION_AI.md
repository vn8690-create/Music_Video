# AI subtitles validation — V5.4

## Real inference

The production module worker ran in local Chromium 138 with the unmodified Transformers.js 3.8.1 package, real quantized Xenova/whisper-tiny weights (revision 5332fcc35e32a33b86612b9a57a89be7906102b1), and single-threaded ONNX WASM. An offline transport mirror served the official package/model bytes to the browser; inference and timestamps were not mocked.

- The English JFK speech sample from Xenova/transformers.js-docs produced readable transcript rows with nonempty word timestamps; applying them populated the real karaoke renderer.
- A longer sample made by repeating that speech with silence crossed the worker's 20-second chunk boundary and produced valid timestamps beyond 30 seconds; application to the video passed.
- Mobile-sized UI review was visually inspected. These are desktop browser runs, not physical iPhone performance measurements. Vietnamese/Japanese singing accuracy and actual iPhone model download/inference still need user song/device testing.

## Automated coverage

- Pure tests: missing timestamps are rejected, reference lines with insufficient anchors require manual timing, range clipping preserves surrounding subtitles, mono resampling handles stereo/offset/cancellation, plus existing ASS/LRC/SRT parsers.
- Browser integration: simulated worker responses exercise review-before-apply, selected-track timing offsets, preservation of other tracks, cancel, network error recovery and native video export. These UI tests do not claim model accuracy.
- Existing media import, motion effects, logo/disc, album layout, recording and pause/resume checks remain enabled for Chromium and WebKit in CI.

## Limitations

Tiny is intended as a lightweight draft generator. Musical accompaniment can cause hallucination or inaccurate word timing. Reference text matching uses monotonic token anchors, not acoustic forced alignment. Unmatched lines retain empty times. Editing text or times switches that cue to estimated within-line highlighting. Results are not saved automatically across page reload; download LRC. Browser background suspension and memory limits still apply.
