# Design QA

final result: passed

Prototype: http://127.0.0.1:5174/?layout=3

Reference target:
- Scene A: one full room image with the computer already sitting on the desk.
- Scene B: text composition reference only, not a second scene layer.

Checks:
- One-shot continuity: passed. Rendered DOM has 1 `.room-shot` and 0 `.room-shot-b`; the camera scales the single composed room image.
- No extra desk/computer layers: passed. Source no longer references separate desk, chair, or computer props.
- Final camera state: passed. `.camera` reaches `scale(2.22)` from a fixed origin near the desk computer.
- Scene B placement at 1440x810: passed. Title sits at x 577, y 167, w 301, h 77; left keywords at x 184; right keywords at x 1131-1156; support text at x 500, y 612.
- Scroll cue prompt: passed. Cue sits at x 636, y 715, w 168, h 57 and uses a timed brightness/drop-shadow pulse.
- Build: passed. Vite production build and site build preparation completed.

Note:
- The in-app browser screenshot call timed out after the final small scroll-cue/title tweak, but the live preview is open and the rendered DOM/layout data was verified after restarting the 5174 preview.
