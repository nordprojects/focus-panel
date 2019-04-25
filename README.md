# Focus panel

An HTML element that keeps the contents filling the container, but with a
configurable focus point.

Useful for layouts with big full screen image/video backgrounds, which have
areas that text should avoid.

## Installation

`<script src="https://unpkg.com/focus-panel[@version]></script>` (`[@version]` is optional, but recommended)

or

`npm install focus-panel`, `require('focus-panel')`

## Usage

Call the global `focusPanelInit({mobileBreakpoint: ...})` to attach to all
elements with the class name `focus-panel`.

e.g.

```html
<div class="focus-panel"
     data-max-height="500">
    <video autoplay loop muted playsinline>
        <source src="https://nordprojects-static.s3.amazonaws.com/lantern/lantern-hero-mobile.mp4" type="video/mp4">
        <source src="https://nordprojects-static.s3.amazonaws.com/lantern/lantern-hero-mobile.webm" type="video/webm">
    </video>
</div>
<script src="https://unpkg.com/focus-panel"></script>
<script>
    focusPanelInit();
</script>
```

## Options

Options are specified with data attributes.

| Option name              | Example       | Description                      | 
| ------------------------ | ------------- | -------------------------------- |
| `data-background`        | `/img/bg.jpg` | An image to use as the background of the element. If omitted, uses the first child element.
| `data-aspect-ratio`      | `16:9`        | The desired aspect ratio of the panel. Sets the height according to the width of the container.
| `data-max-height`        | `500`         | The max height of the element, in pixels. Limits the height, regardless of aspect ratio.
| `data-offset`            | `2.0% -10.0%` | The amount to offset the image by, relative to the anchor point. Tweak with `dev` mode.
| `data-anchor-point`      | `90.0% 50.0%` | The amount to offset the image by, relative to the anchor point. Tweak with `dev` mode.
| `data-background-width`  | `1500`        | The desired background width, in pixels. This is a minimum, it's ignored if the background must grow to fill the container. Tweak with `dev` mode.

All options accept mobile/desktop modifiers. For example, you can set
`data-aspect-ratio-mobile` and 
`data-aspect-ratio-desktop` and they'll change at the breakpoint.

## Workflow: tweak with `dev` mode

Once you've got the image panels in, with set aspect ratio, view the page with `?dev` to use dev mode. Hold 'shift' and hover the mouse over a panel to select it. Then use:

| | |
| ------------ | ------------------------------------------   |
| mouse click | Sets the focus point relative to the container |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | Moves the image relative to the focus point
| <kbd>+</kbd> <kbd>-</kbd> | Grow/shink the background

The settings you tweak can then be copied from the overlay on the panel into your HTML.
