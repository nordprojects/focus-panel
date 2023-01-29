import h from 'hyperscript';

import Vector from './Vector'
import {getParameterByName, clamp} from './util';

const ARROW_LEFT = 37;
const ARROW_UP = 38;
const ARROW_RIGHT = 39;
const ARROW_DOWN = 40;
const PLUS = 187
const MINUS = 189
const SHIFT = 16;

let mobileBreakpointDetectorGlobal: HTMLElement

export default class FocusPanel {
    backgroundContainerElement: HTMLElement
    backgroundImage: HTMLElement
    contentElement: HTMLElement
    componentChildren: HTMLElement[]
    observer: MutationObserver

    private static mobileBreakpoint = 748;

    /**
     * Must be set before the first use of FocusPanel
     */
    static setMobileBreakpoint(breakpointMaxWidth: number) {
        FocusPanel.mobileBreakpoint = breakpointMaxWidth;
    }

    get mobileBreakpointDetector() {
        if (!mobileBreakpointDetectorGlobal) {
            mobileBreakpointDetectorGlobal = h('.focus-panel-page-width-detector');
            document.body.appendChild(mobileBreakpointDetectorGlobal);
            document.body.appendChild(h('style', `
                .focus-panel-page-width-detector {
                    position: absolute;
                    opacity: 0;

                    /* we read this visibility property in JS to detect the breakpoint */
                    visibility: hidden;

                }
                @media(max-width: ${FocusPanel.mobileBreakpoint}px) {
                    .focus-panel-page-width-detector {
                        visibility: visible;
                    }
                }
            `));
        }
        return mobileBreakpointDetectorGlobal;
    }

    constructor(readonly element: HTMLElement) {
        this.checkDatasetProps();
        this.update = this.update.bind(this);
        this.componentChildren = Array.from(element.children) as HTMLElement[];
        this.componentChildren.forEach(el => el.remove());

        this.backgroundContainerElement = h('.focus-panel-background');
        if (this.props.background) {
            this.backgroundImage = h('img', {src: this.props.background});
        } else {
            // if no image URL is set as a prop, use the first child as the
            // background. This can be a video if necessary.
            this.backgroundImage = this.componentChildren.shift()!;
            if (!this.backgroundImage) {
                throw ('focus-panel must have a data-background attribute ' +
                       'or have a child element to be used as the background');
            }
        }

        this.backgroundImage.addEventListener('error', this.update);
        this.backgroundImage.addEventListener('load', this.update);
        this.backgroundImage.addEventListener('loadeddata', this.update);
        this.backgroundContainerElement.appendChild(this.backgroundImage);
        element.appendChild(this.backgroundContainerElement);
        this.contentElement = h('.focus-panel-content', this.componentChildren);
        element.appendChild(this.contentElement);

        this.update();

        this.observer = new MutationObserver(this.update);
        this.observer.observe(element, {attributes: true});
        window.addEventListener('resize', this.update);

        if (getParameterByName('dev') !== null) {
            this.devModeInit();
        }
    }

    propNames = ['background', 'aspectRatio', 'offset', 'backgroundWidth', 
                 'anchorPoint', 'maxHeight']
    get props() {
        return {
            background: this.prop('background'),
            aspectRatio: this.prop('aspectRatio', {mobile: '1:1', desktop: '1024:550'})!,
            offset: this.prop('offset', {default: '0% 0%'})!,
            backgroundWidth: this.prop('backgroundWidth', {default: '1'})!,
            anchorPoint: this.prop('anchorPoint', {default: '50% 50%'})!,
            maxHeight: this.prop('maxHeight', {default: '1e100'})!,
        }
    }

    prop(name: string, defaults: {default?: string, mobile?: string, desktop?: string} = {}): string|undefined {
        let viewportName, propDefault = defaults.default;
        if (this.isMobile) {
            viewportName = name + 'Mobile';
            if (defaults.mobile !== undefined) {
                propDefault = defaults.mobile;
            }
        } else {
            viewportName = name + 'Desktop';
            if (defaults.desktop !== undefined) {
                propDefault = defaults.desktop;
            }
        }

        if (this.element.dataset[viewportName] !== undefined) {
            return this.element.dataset[viewportName];
        } else if (this.element.dataset[name] !== undefined){
            return this.element.dataset[name];
        } else {
            return propDefault;
        }
    }

    get isMobile() {
        const style = window.getComputedStyle(this.mobileBreakpointDetector, null);
        return style.visibility == 'visible';
    }

    get isDesktop() {
        return !this.isMobile;
    }

    update() {
        const props = this.props;
        this.element.style.position = 'relative';
        this.element.style.zIndex = '0';
        const containerWidth = this.element.clientWidth;
        const isMobile = this.isMobile;

        // null out the styles to start
        this.backgroundContainerElement.style.cssText = '';
        this.backgroundImage.style.cssText = '';
        this.contentElement.style.cssText = '';

        const imageAspectRatio = this.getBackgroundAspectRatio();

        // easy stuff first, set the dimensions of the background element.
        if (this.isDesktop) {
            this.backgroundContainerElement.style.top = '0';
            this.backgroundContainerElement.style.bottom = '0';
            this.backgroundContainerElement.style.left = '0';
            this.backgroundContainerElement.style.right = '0';
        }
        this.backgroundContainerElement.style.position = this.isMobile ? 'relative' : 'absolute';
        this.backgroundContainerElement.style.overflow = 'hidden';
        const aspectRatio = this.parseRatio(props.aspectRatio);

        const maxHeight = +props.maxHeight;
        const height = Math.min(maxHeight, containerWidth / aspectRatio);

        if (this.isMobile) {
            this.backgroundContainerElement.style.height = `${height}px`;
            this.contentElement.style.minHeight = 'unset';
        } else {
            this.backgroundContainerElement.style.height = 'unset';
            // this.contentElement.style.minHeight = `${height}px`;
        }
        this.contentElement.style.position = 'relative';

        // find the size of the background element (the element we need to fill)
        let elementSize = {
            x: this.backgroundContainerElement.offsetWidth,
            y: this.backgroundContainerElement.offsetHeight,
        }

        // calcuate the position of the image
        let imageWidth = parseFloat(this.props.backgroundWidth);
        let imageSize = {x: imageWidth, y: imageWidth / imageAspectRatio};

        const anchorPointPosition = this.parsePercentPairs(this.props.anchorPoint);
        const offset = this.parsePercentPairs(this.props.offset);
        const imagePosition = Vector.add(anchorPointPosition, offset);
        imagePosition.x = clamp(imagePosition.x, 0, 1);
        imagePosition.y = clamp(imagePosition.y, 0, 1);

        // calculate offsets to the edges with these dimensions
        let imagePixelPosition = Vector.multEach(imagePosition, imageSize);
        const topLeftImageQuadrantPixelSize = imagePixelPosition;
        const bottomRightImageQuadrantPixelSize = Vector.sub(imageSize, imagePixelPosition);

        const anchorPointPixelPosition = Vector.multEach(anchorPointPosition, elementSize);
        const topLeftContainerQuadrantPixelSize = anchorPointPixelPosition;
        const bottomRightContainerQuadrantPixelSize = Vector.sub(elementSize, topLeftContainerQuadrantPixelSize);

        let leftRatio = topLeftImageQuadrantPixelSize.x / topLeftContainerQuadrantPixelSize.x;
        let topRatio = topLeftImageQuadrantPixelSize.y / topLeftContainerQuadrantPixelSize.y;
        let rightRatio = bottomRightImageQuadrantPixelSize.x / bottomRightContainerQuadrantPixelSize.x;
        let bottomRatio = bottomRightImageQuadrantPixelSize.y / bottomRightContainerQuadrantPixelSize.y;

        if (!isFinite(topRatio)) { topRatio = 1; this.debug(`ignored topRatio constraint`); }
        if (!isFinite(leftRatio)) { leftRatio = 1; this.debug(`ignored leftRatio constraint`); }
        if (!isFinite(bottomRatio)) { bottomRatio = 1; this.debug(`ignored bottomRatio constraint`); }
        if (!isFinite(rightRatio)) { rightRatio = 1; this.debug(`ignored rightRatio constraint`); }

        // the minumum of these numbers represents the worst case of the image
        // failing to fill the container.
        const minRatio = Math.min(topRatio, leftRatio, bottomRatio, rightRatio);

        // if this is less than 1, scale the image until it does fill.
        let scaleFactor = 1;
        if (minRatio < 1) {
            scaleFactor = 1/minRatio;
        }
        imageSize = Vector.mult(imageSize, scaleFactor);
        imagePixelPosition = Vector.multEach(imagePosition, imageSize)

        this.backgroundImage.style.width = `${imageSize.x}px`;
        this.backgroundImage.style.height = `${imageSize.y}px`;

        const topLeftOffset = Vector.sub(anchorPointPixelPosition, imagePixelPosition);

        this.backgroundImage.style.maxHeight = 'none';
        this.backgroundImage.style.maxWidth = 'none';
        this.backgroundImage.style.position = 'absolute';
        this.backgroundImage.style.left = `${topLeftOffset.x}px`;
        this.backgroundImage.style.top = `${topLeftOffset.y}px`;

        if (this.devMode) this.devModeUpdate();
    }

    parsePercentPairs(pairs: string): Vector {
        const components = pairs.trim().split(/[\s\%,]+/);
        if (components.length < 2 || !isFinite(+components[0]) || !isFinite(+components[1])) {
            this.warn(`failed to parse "${pairs}". format should be "50% 50%"`);
            return Vector.create();
        }
        return {x: +components[0]/100, y: +components[1]/100};
    }

    formatPercentPairs(vector: Vector): string {
        const percentVector = Vector.mult(vector, 100);
        return `${percentVector.x.toFixed(1)}% ${percentVector.y.toFixed(1)}%`
    }

    parseRatio(ratio: string): number {
        const components = ratio.trim().split(/[\s:]+/);
        if (components.length < 2 || !isFinite(+components[0]) || !isFinite(+components[1])) {
            this.warn(`failed to parse "${ratio}". format should be "4:3"`);
            return 1;
        }
        return +components[0]/+components[1]
    }

    getBackgroundAspectRatio() {
        const bgImage = (this.backgroundImage as HTMLImageElement)
        if (bgImage.naturalHeight) {
            return bgImage.naturalWidth / bgImage.naturalHeight
        }

        const bgVideo = (this.backgroundImage as HTMLVideoElement)
        if (bgVideo.videoHeight) {
            return bgVideo.videoWidth / bgVideo.videoHeight;
        }

        // fallback when those don't work...
        return 1;
    }

    checkDatasetProps() {
        const validPropNames: string[] = []
        this.propNames.forEach(p => {
            validPropNames.push(p, p+'Mobile', p+'Desktop');
        });
        for (const key in this.element.dataset) {
            if (!validPropNames.includes(key)) {
                this.warn(`unknown data-prop "${key}"`)
            }
        }
    }

    warn(what: string) {
        console.warn(`FocusPanel: ${what}`, this.element);
    }

    debug(what: string) {
        if (this.devMode) {
            console.debug(`FocusPanel: ${what}`, this.element);
        }
    }

    // Dev mode //
    devMode!: {
        anchorPointIndicator: HTMLElement,
        attributesField: HTMLInputElement,
        shiftDown: boolean,
        mouseOver: boolean,
        tweakedParams: Set<string>,
    };

    devModeInit() {
        this.devMode = {
            anchorPointIndicator: h('.focus-panel-dev-anchor-point', {
                style: {
                    background: 'yellow',
                    width: '10px',
                    height: '10px',
                    'border-radius': '5px',
                    'box-shadow': '0 2px 10px black',
                    position: 'absolute',
                    transform: 'translate(-50%, -50%)',
                }
            }),
            attributesField: h('span.focus-panel-dev-attributes-field', {
                type: 'text',
                contenteditable: 'true',
                style: {
                    background: 'transparent',
                    color: 'white',
                    'text-shadow': '0 1px 0 black',
                    position: 'absolute',
                    right: '0',
                    bottom: '0',
                    font: '12px/15px monospace',
                    border: 'none',
                    'z-index': '1',
                    'text-align': 'right',
                    'max-width': '90%',
                }
            }),
            shiftDown: false,
            mouseOver: false,
            tweakedParams: new Set(),
        }

        this.backgroundContainerElement.appendChild(this.devMode.anchorPointIndicator);
        this.backgroundContainerElement.appendChild(this.devMode.attributesField);

        this.element.addEventListener('mouseenter', () => {
            this.devMode.mouseOver = true
            this.devModeUpdate()
        });
        this.element.addEventListener('mouseleave', () => {
            this.devMode.mouseOver = false
            this.devModeUpdate()
        });
        this.element.addEventListener('mousemove', event => {
            this.devMode.shiftDown = event.shiftKey;
        })
        window.addEventListener('keydown', event => {
            this.devMode.shiftDown = event.shiftKey;

            if (event.keyCode == SHIFT) {
                this.devMode.shiftDown = true;
                this.devModeUpdate()
            }
            if (this.devMode.mouseOver && this.devMode.shiftDown) {
                const offsetVector = {x: 0, y: 0}

                if (event.keyCode == ARROW_LEFT) { offsetVector.x = -0.01 }
                if (event.keyCode == ARROW_RIGHT) { offsetVector.x = +0.01 }
                if (event.keyCode == ARROW_UP) { offsetVector.y = -0.01 }
                if (event.keyCode == ARROW_DOWN) { offsetVector.y = +0.01 }

                if (offsetVector.x != 0 || offsetVector.y != 0) {
                    const offset = this.parsePercentPairs(this.props.offset);
                    const newOffset = Vector.add(offset, offsetVector);

                    const propName = this.isDesktop ? 'offsetDesktop' : 'offsetMobile';
                    this.element.dataset[propName] = this.formatPercentPairs(newOffset);
                    this.devMode.tweakedParams.add(propName);
                    this.update();
                }

                let sizeScale = 1;
                if (event.keyCode == PLUS) {
                    sizeScale *= 1.02;
                } 
                if (event.keyCode == MINUS) {
                    sizeScale /= 1.02;
                }
                if (sizeScale != 1) {
                    const propName = this.isDesktop ? 'backgroundWidthDesktop' : 'backgroundWidthMobile';
                    let size = +this.props.backgroundWidth;
                    if (size == 1) {
                        size = this.backgroundContainerElement.clientWidth;
                    }
                    size *= sizeScale;
                    this.element.dataset[propName] = size.toFixed(0);
                    this.devMode.tweakedParams.add(propName);
                    this.update();
                }
            }
        });
        window.addEventListener('keyup', event => {
            if (event.keyCode == SHIFT) {
                this.devMode.shiftDown = false;
                this.devModeUpdate()
            }
        });
        this.element.addEventListener('mousedown', event => {
            this.devMode.shiftDown = event.shiftKey;
            if (event.target == this.devMode.attributesField) {
                return;
            }

            if (this.devMode.shiftDown) {
                event.preventDefault();
                event.stopPropagation();
                const rect = this.backgroundContainerElement.getBoundingClientRect()

                const position = {
                    x: (event.pageX - rect.left - window.pageXOffset) / rect.width,
                    y: (event.pageY - rect.top - window.pageYOffset) / rect.height,
                }

                const propName = this.isDesktop ? 'anchorPointDesktop' : 'anchorPointMobile';
                this.element.dataset[propName] = this.formatPercentPairs(position);
                this.devMode.tweakedParams.add(propName);
                this.update();
            }
        }, {capture: true})

        this.devModeUpdate();
    }
    devModeUpdate() {
        const anchorPoint = this.parsePercentPairs(this.props.anchorPoint);
        const showAnchorPoint = this.devMode.mouseOver && this.devMode.shiftDown;
        this.devMode.anchorPointIndicator.style.visibility = showAnchorPoint ? 'visible' : 'hidden';
        this.devMode.anchorPointIndicator.style.left = `${anchorPoint.x*100}%`;
        this.devMode.anchorPointIndicator.style.top = `${anchorPoint.y*100}%`;

        let attributesString = '';
        for (const propCamelName of Array.from(this.devMode.tweakedParams)) {
            attributesString += ` data-${camelToKebabCase(propCamelName)}="${this.element.dataset[propCamelName]}"`
        }
        this.devMode.attributesField.textContent = attributesString;

        this.backgroundImage.style.outline = showAnchorPoint ? '1px solid yellow' : '';
        this.backgroundImage.style.outlineOffset = showAnchorPoint ? '-1px' : '';
    }
}

function camelToKebabCase(string: string) {
    return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
