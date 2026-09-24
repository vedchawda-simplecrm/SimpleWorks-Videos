# R-YaBot AI-processing loader

Built from `ryabot-default.png` (standing) and `ryabot-thinking.png`
(meditating). The settle into meditation takes 3.9s; one breath is 3.5s.

## Use it in the React app

Copy these five files plus the two PNGs:

```
RyabotLoading.tsx      the one you render
useRyabotLoading.ts    decides when to actually show it
RyabotLoader.tsx       the character itself
ryabot-loader.css      generated motion - do not hand-edit
ryabot-loading.css     overlay + fade, yours to restyle
```

```tsx
import { RyabotLoading } from "./RyabotLoading";
import "./ryabot-loader.css";
import "./ryabot-loading.css";

<div style={{ position: "relative" }}>
  <RyabotLoading loading={isFetching} overlay caption="Loading opportunities" />
  <DataTable rows={rows} />
</div>
```

### It does not need to know how long the load takes

The settle plays once, then the meditation idle is an infinite CSS loop. It
holds that pose for as long as `loading` stays true, however long that is.
Nothing to configure, nothing to keep in sync with the request.

### What it does about unpredictable load times

| Situation | What happens | Prop |
| --- | --- | --- |
| List returns in 80ms from cache | Nothing is shown at all | `delay` (250ms) |
| Returns just after that | Stays up briefly instead of flashing | `minVisible` (700ms) |
| Filter re-applied | Goes straight to the meditation pose | `intro="once"` |

`intro="once"` is the default. Replaying a 3.9s settle on every filter change
makes the app feel slower than it is, because the user ends up waiting on the
animation rather than the data. The first load gets the full introduction;
later loads open already meditating. Use `intro="always"` to replay it every
time, or `intro="never"` to skip it.

If data arrives mid-settle the loader fades out where it is rather than
finishing the animation.

### Props

| Prop | Default | Notes |
| --- | --- | --- |
| `loading` | - | Your `isFetching` / `isLoading` |
| `size` | `112` | px; the art is square |
| `caption` | - | Line under the character |
| `intro` | `"once"` | `"once"`, `"always"` or `"never"` |
| `delay` | `250` | ms before anything appears |
| `minVisible` | `700` | ms it stays once shown |
| `overlay` | `false` | Fills the nearest positioned ancestor |
| `label` | `"Loading"` | For assistive tech |
| `standingSrc` / `meditatingSrc` | `/assets/...` | Where you serve the PNGs |

With `overlay`, the parent needs `position: relative`. `ryabot-loading.css`
is light and stays light: it deliberately ignores
prefers-color-scheme, which reports the OS setting rather than this app's
theme, so a light CRM on a dark-mode laptop would otherwise get a black
overlay. Restyle via three custom properties:

    .ryabot-loading {
      --ryabot-overlay-bg: rgba(255, 255, 255, 0.72);
      --ryabot-overlay-blur: 3px;
      --ryabot-caption-color: #6b6458;
    }

For a dark theme, add the `ryabot-loading--dark` class or set those
properties under your own theme selector.

`role="status"`, `aria-live="polite"`, `aria-hidden` while faded out, and a
`prefers-reduced-motion` block that freezes the resting pose with pulses off.

## The animation

**Idle** - a 3.5s breath: the body floats, the chest widens slightly less
than it rises about a planted seat, and three rings pulse out from behind the
head.

**Settle** - 0.4s still, ~3.0s lowering, 0.5s coming to rest, ending on
exactly the idle's frame 0.

**Pulses** - three rings a third of a cycle apart, each born inside the skull
so it emerges from behind the head, travelling to nearly twice the head
radius before fading out.

The character is drawn at 76% of the canvas. At full size the ears reach
150px from the head centre while the canvas allowed only a ~145px radius, so
a ring could never clear the silhouette and showed as a hairline arc over the
scalp. Backing the art off gives the halo somewhere to go.

## Files

| File | What it is |
| --- | --- |
| `RyabotLoading.tsx` | The wired-up component - render this one |
| `useRyabotLoading.ts` | Delay / minimum-visible timing |
| `RyabotLoader.tsx` | The character, no timing logic |
| `ryabot-loader.css` | Generated keyframes - do not hand-edit |
| `ryabot-loading.css` | Overlay, fade and caption |
| `demo.html` | Local preview of idle / settle / 64px |
| `seq-idle/` | 105 PNG frames, 512x512, true alpha - the loop |
| `seq-intro/` | 117 PNG frames, 512x512, true alpha - the settle |
| `../../out/ryabot-loader-idle.webm` | The loop as video, matted on black |
| `../../out/ryabot-loader-intro.webm` | The settle as video, matted on black |
| `../../out/ryabot-loader-preview.webm` | Settle + 3 breaths, for review |

For the CRM use the CSS build, not the video: no decode, real alpha, any
size, and it keeps animating on the compositor while the main thread is busy
with the response - precisely when a loader must not stutter.

The WebMs are matted rather than transparent because Remotion ships a minimal
ffmpeg whose VP9 encoder drops the alpha plane. The PNG frames keep it. For a
transparent video, encode the frames with a full ffmpeg:

```
ffmpeg -framerate 30 -i seq-idle/element-%03d.png \
  -c:v libvpx-vp9 -pix_fmt yuva420p -crf 22 -b:v 0 -auto-alt-ref 0 \
  ryabot-loader-idle.webm
```

## Single source of motion

The motion lives in `src/videos/ryabot/loader/pose.ts`. The Remotion
compositions read it directly; the CSS is generated from it. Change the maths
there and rebuild - never edit the generated CSS, it gets overwritten.

- `npm run loader:check` - asserts the loop is seamless and nothing clips
- `npm run loader:css` - regenerate the stylesheet
- `npm run loader:frames` - re-render the alpha PNG sequence

### Why the loop is seamless

Every idle term is a harmonic of one period, so it closes by construction
rather than by matching first and last frames by eye:

```
y       = -(5*sin(p) + 1.4*sin(2p))     p = 2*pi*frame / 105
scaleY  = 1 + 0.009*sin(p)
scaleX  = 1 - 0.004*sin(p)
rotate  = 0.28deg*sin(p)
```

All four are exactly zero at p = 0 and their derivatives match across the
seam, so there is no hitch as well as no jump. The settle ends on that same
zero. The three pulses share the period and sit a third of a cycle apart, so
the pattern repeats three times per breath and still closes; each ring fades
to zero at both ends of its life, so the instant one wraps is invisible too.

`loader:check` asserts all of it - position and velocity continuity, the ring
set closing, ring opacity at the wrap, and that neither the art nor the
largest ring touches the frame edge.

## Known limits

The source is two flat PNGs, so these are not in this build:

- Arms bending, shoulders relaxing, legs folding - the pose change is a
  0.47s cross-dissolve under a blur and a downward settle, not articulation.
- Eyelids closing gradually - the eyes change with that same dissolve.
- Independent head tilt - approximated by a 0.28deg whole-body sway.
- Secondary motion on beads, earrings and fabric - they move with the body,
  since they cannot be separated from a flat image.

The idle, timing, looping and fixed-camera framing are all as specified. Real
articulation needs a rigged 3D model, or a generative video pass over these
stills.
