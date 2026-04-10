import {
    prepareWithSegments,
    measureNaturalWidth,
} from 'https://esm.sh/@chenglou/pretext@0.0.5'

// ── Custom Cursor (disabled on touch) ────────────────────

const dot = document.getElementById('cursor')
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

if (!isTouch) {
    const hoverTargets = document.querySelectorAll('.hover-target')
    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX
        mouseY = e.clientY
        dot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`
    })

    hoverTargets.forEach(target => {
        target.addEventListener('mouseenter', () => {
            dot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%)) scale(2)`
        })
        target.addEventListener('mouseleave', () => {
            dot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%)) scale(1)`
        })
    })
} else {
    dot.style.display = 'none'
}

// ── ASCII Rotating Globe ─────────────────────────────────

const asciiCanvas = document.getElementById('ascii-globe')
const globeCtx = asciiCanvas.getContext('2d')

let globeWidth, globeHeight
let points = []
const numPoints = 12000
let rotationY = 0
let maskImageData = null
let maskWidth, maskHeight

function loadMaskAndInit() {
    const img = new Image()
    img.src = 'earth-mask.jpg'
    img.onload = () => {
        const offCanvas = document.createElement('canvas')
        maskWidth = img.width
        maskHeight = img.height
        offCanvas.width = maskWidth
        offCanvas.height = maskHeight
        offCanvas.getContext('2d').drawImage(img, 0, 0)
        maskImageData = offCanvas.getContext('2d').getImageData(0, 0, maskWidth, maskHeight).data
        initGlobe()
        renderGlobe()
    }
    img.onerror = () => {
        initGlobe()
        renderGlobe()
    }
}

function initGlobe() {
    globeWidth = asciiCanvas.parentElement.clientWidth
    globeHeight = asciiCanvas.parentElement.clientHeight
    const dpr = window.devicePixelRatio || 1
    asciiCanvas.width = globeWidth * dpr
    asciiCanvas.height = globeHeight * dpr
    globeCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

    points = []
    const phi = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < numPoints; i++) {
        const y = 1 - (i / (numPoints - 1)) * 2
        const radiusAtY = Math.sqrt(1 - y * y)
        const theta = phi * i
        const x = Math.cos(theta) * radiusAtY
        const z = Math.sin(theta) * radiusAtY

        let isLand = true
        if (maskImageData) {
            let lon = Math.atan2(x, z)
            let lat = Math.asin(y)
            lon += Math.PI * 0.2
            if (lon > Math.PI) lon -= 2 * Math.PI
            const u = (lon + Math.PI) / (2 * Math.PI)
            const v = (Math.PI / 2 - lat) / Math.PI
            const px = Math.floor(u * (maskWidth - 1))
            const py = Math.floor(v * (maskHeight - 1))
            const idx = (py * maskWidth + px) * 4
            isLand = maskImageData[idx] < 128
        }

        if (isLand) {
            points.push({ x, y, z, char: Math.random() > 0.5 ? '1' : '0' })
        }
    }
}

function renderGlobe() {
    globeCtx.clearRect(0, 0, globeWidth, globeHeight)
    rotationY -= 0.003
    const cosY = Math.cos(rotationY)
    const sinY = Math.sin(rotationY)
    const tiltX = -0.2
    const cosX = Math.cos(tiltX)
    const sinX = Math.sin(tiltX)
    const radius = Math.min(globeWidth, globeHeight) * 0.45
    const centerX = globeWidth / 2
    const centerY = globeHeight / 2

    globeCtx.font = '12px Geist, monospace'
    globeCtx.textAlign = 'center'
    globeCtx.textBaseline = 'middle'

    const projected = points.map(p => {
        const rotX = p.x * cosY - p.z * sinY
        const rotZ = p.z * cosY + p.x * sinY
        const finalY = p.y * cosX - rotZ * sinX
        const finalZ = rotZ * cosX + p.y * sinX
        return { x: rotX, y: finalY, z: finalZ, char: p.char }
    })
    projected.sort((a, b) => a.z - b.z)

    for (let i = 0; i < projected.length; i++) {
        const p = projected[i]
        if (p.z < -0.6) continue
        const screenX = centerX + p.x * radius
        const screenY = centerY - p.y * radius
        const depth = (p.z + 1) / 2
        const opacity = Math.pow(depth, 1.5) * 0.9
        const r = Math.floor(160 + Math.pow(depth, 2) * 95)
        const g = Math.floor(100 + Math.pow(depth, 2) * 120)
        const b = Math.floor(40 + Math.pow(depth, 2) * 80)
        globeCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
        globeCtx.fillText(p.char, screenX, screenY)
    }

    requestAnimationFrame(renderGlobe)
}

window.addEventListener('resize', () => {
    if (Math.abs(globeWidth - asciiCanvas.parentElement.clientWidth) > 10) {
        initGlobe()
    }
})

loadMaskAndInit()

// ── TRICK Scroll Animation (pretext-powered) ─────────────
/* ─────────────────────────────────────────────────────────
 * TRICK → WORLD TOUR  SCROLL STORYBOARD
 *
 * Progress    Stage
 * ──────────────────────────────────────────────────
 *  0.00       Section enters — T R I C K initials visible
 *  0.05       T → TRUST chars slide out from behind T
 *  0.10       R → RESPECT
 *  0.15       I → INDEPENDENCE
 *  0.20       C → COLLABORATION
 *  0.25       K → KINDNESS
 *  0.35       All words fully expanded, hold
 *  0.50–0.65  TRICK canvas fades out ↑
 *  0.60–0.80  "The World Tour" fades in ↓
 *  0.80–1.00  Hold World Tour visible
 * ──────────────────────────────────────────────────
 *  ASCII globe stays on right side throughout
 * ───────────────────────────────────────────────────────── */

const TRICK_WORDS = ['TRUST', 'RESPECT', 'INDEPENDENCE', 'COLLABORATION', 'KINDNESS']

function trickFontSize() { return window.innerWidth < 768 ? 42 : 76 }
function trickFont() { return `${trickFontSize()}px "Instrument Serif", serif` }
function trickLineHeight() { return Math.round(trickFontSize() * 1.21) }
let lastTrickSize = 0

const SCROLL = {
    wordStart:    0.05,   // first word begins expanding
    wordStep:     0.05,   // stagger between words
    wordDur:      0.12,   // duration per word expansion
    fadeOutStart:  0.50,
    fadeOutEnd:    0.65,
    fadeInStart:   0.60,
    fadeInEnd:     0.80,
}

const trickCanvas = document.getElementById('trick-canvas')
const trickCtx = trickCanvas?.getContext('2d')
const trickContainer = document.querySelector('.trick-container')
const tourContent = document.querySelector('.tour-content')
const tourSection = document.querySelector('.tour-section')

let trickWords = null // measured word data from pretext

function measureWords() {
    lastTrickSize = trickFontSize()
    const font = trickFont()
    trickWords = TRICK_WORDS.map(word => {
        const chars = [...word]
        // Use pretext to measure each character precisely
        const widths = chars.map(ch => measureNaturalWidth(prepareWithSegments(ch, font)))

        // Accumulate x positions
        const positions = []
        let x = 0
        for (let i = 0; i < chars.length; i++) {
            positions.push(x)
            x += widths[i]
        }

        return { chars, widths, positions, totalWidth: x }
    })
}

function sizeTrickCanvas() {
    if (!trickCanvas || !trickCtx) return
    const dpr = window.devicePixelRatio || 1
    const containerW = trickCanvas.parentElement?.clientWidth || 680
    const w = Math.min(680, containerW)
    const h = TRICK_WORDS.length * trickLineHeight() + 8
    trickCanvas.width = w * dpr
    trickCanvas.height = h * dpr
    trickCanvas.style.width = w + 'px'
    trickCanvas.style.height = h + 'px'
    trickCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function scrollProgress() {
    if (!tourSection) return 0
    const rect = tourSection.getBoundingClientRect()
    const range = tourSection.offsetHeight - window.innerHeight
    return Math.max(0, Math.min(1, -rect.top / range))
}

function easeOutCubic(t) {
    return 1 - (1 - t) * (1 - t) * (1 - t)
}

function renderTRICK() {
    if (!trickWords || !trickCtx) return

    const progress = scrollProgress()
    const lh = trickLineHeight()
    const W = parseFloat(trickCanvas.style.width) || 680
    const H = TRICK_WORDS.length * lh + 8

    trickCtx.clearRect(0, 0, W, H)
    trickCtx.font = trickFont()
    trickCtx.textBaseline = 'alphabetic'
    trickCtx.textAlign = 'left'

    for (let wi = 0; wi < trickWords.length; wi++) {
        const word = trickWords[wi]
        const baseY = (wi + 1) * lh

        // How expanded is this word? 0 = just initial letter, 1 = fully revealed
        const wStart = SCROLL.wordStart + wi * SCROLL.wordStep
        const wProg = Math.max(0, Math.min(1, (progress - wStart) / SCROLL.wordDur))

        for (let ci = 0; ci < word.chars.length; ci++) {
            if (ci === 0) {
                // Initial letter — always visible, gold
                trickCtx.fillStyle = '#E2BA75'
                trickCtx.fillText(word.chars[ci], word.positions[ci], baseY)
            } else {
                // Remaining chars — staggered slide-out from behind the first letter
                const charNorm = ci / (word.chars.length - 1)
                const charProg = Math.max(0, Math.min(1,
                    (wProg - charNorm * 0.35) / 0.65
                ))

                if (charProg > 0) {
                    const eased = easeOutCubic(charProg)
                    // Start position: tucked behind the first letter
                    const fromX = word.positions[0] + word.widths[0] * 0.2
                    const toX = word.positions[ci]
                    const x = fromX + (toX - fromX) * eased

                    trickCtx.fillStyle = `rgba(240, 237, 231, ${charProg})`
                    trickCtx.fillText(word.chars[ci], x, baseY)
                }
            }
        }
    }

    // ── Phase 2: Crossfade TRICK → World Tour ──

    if (trickContainer) {
        if (progress > SCROLL.fadeOutEnd) {
            trickContainer.style.opacity = '0'
            trickContainer.style.transform = 'translateY(-50px)'
        } else if (progress > SCROLL.fadeOutStart) {
            const f = (progress - SCROLL.fadeOutStart) / (SCROLL.fadeOutEnd - SCROLL.fadeOutStart)
            trickContainer.style.opacity = String(1 - f)
            trickContainer.style.transform = `translateY(${-f * 50}px)`
        } else {
            trickContainer.style.opacity = '1'
            trickContainer.style.transform = 'translateY(0)'
        }
    }

    if (tourContent) {
        if (progress > SCROLL.fadeInEnd) {
            tourContent.style.opacity = '1'
            tourContent.style.transform = 'translateY(0)'
        } else if (progress > SCROLL.fadeInStart) {
            const f = (progress - SCROLL.fadeInStart) / (SCROLL.fadeInEnd - SCROLL.fadeInStart)
            tourContent.style.opacity = String(f)
            tourContent.style.transform = `translateY(${(1 - f) * 30}px)`
        } else {
            tourContent.style.opacity = '0'
            tourContent.style.transform = 'translateY(30px)'
        }
    }
}

// Initialize after fonts are ready (pretext needs the real font metrics)
document.fonts.ready.then(() => {
    measureWords()
    sizeTrickCanvas()
    renderTRICK()
})

// Scroll-driven updates (debounced via rAF)
let trickRaf = false
window.addEventListener('scroll', () => {
    if (!trickRaf) {
        trickRaf = true
        requestAnimationFrame(() => {
            trickRaf = false
            renderTRICK()
        })
    }
}, { passive: true })

window.addEventListener('resize', () => {
    if (trickFontSize() !== lastTrickSize) measureWords()
    sizeTrickCanvas()
    renderTRICK()
})

// ── Section 3: Experience — Storyboard Animation ─────────
/* ─────────────────────────────────────────────────────────
 * EXPERIENCE  ANIMATION STORYBOARD
 *
 * Trigger: section enters viewport (IntersectionObserver)
 *
 *  200ms   header fades in, slides up
 *  500ms   pillar 01 — "The Screening" slides up
 *  700ms   pillar 02 — "The Workshop" slides up
 *  900ms   pillar 03 — "The Conversation" slides up
 * 1300ms   cities start appearing (staggered 100ms each)
 * ───────────────────────────────────────────────────────── */

const EXP = {
    header:     200,    // header fades in
    pillarBase: 500,    // first pillar appears
    pillarGap:  200,    // stagger between pillars
    cityBase:   1300,   // first city appears
    cityGap:    100,    // stagger between cities
}

const expSection = document.querySelector('.experience-section')
if (expSection) {
    const header = expSection.querySelector('.experience-header')
    const pillars = expSection.querySelectorAll('.pillar')
    const cities = expSection.querySelectorAll('.city')

    const expObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return

            const timers = []

            timers.push(setTimeout(() => header?.classList.add('visible'), EXP.header))

            pillars.forEach((el, i) => {
                timers.push(setTimeout(() => el.classList.add('visible'), EXP.pillarBase + i * EXP.pillarGap))
            })

            cities.forEach((el, i) => {
                timers.push(setTimeout(() => el.classList.add('visible'), EXP.cityBase + i * EXP.cityGap))
            })

            expObserver.unobserve(entry.target)
        })
    }, { threshold: 0.15 })

    expObserver.observe(expSection)
}

// ── Esther Bio — Photo + Text + Stats (pretext) ──────────
/* ─────────────────────────────────────────────────────────
 * ESTHER BIO  ANIMATION STORYBOARD
 *
 * Trigger: IntersectionObserver (threshold 0.15)
 *
 *    0ms   section enters viewport
 *  200ms   photo slides in from left
 *  400ms   name + bio text fades up
 *  800ms   stats row fades up (canvas, pretext-measured)
 * ───────────────────────────────────────────────────────── */

const BIO = {
    photo: 200,
    text:  400,
    stats: 800,
}

function statNumFont() { return `${window.innerWidth < 768 ? 40 : 64}px "Instrument Serif", serif` }
function statLblFont() { return `600 ${window.innerWidth < 768 ? 10 : 12}px Geist, system-ui, sans-serif` }
let lastStatSize = 0
const STATS_DATA = [
    { number: '600+',  label: 'STUDENTS' },
    { number: '9',     label: 'PUBLICATIONS' },
    { number: '2',     label: 'HONORARY DOCTORATES' },
]

const statsCanvas = document.getElementById('stats-canvas')
const statsCtx = statsCanvas?.getContext('2d')
let measuredStats = null

function measureStatsPretext() {
    lastStatSize = window.innerWidth < 768 ? 40 : 64
    const font = statNumFont()
    measuredStats = STATS_DATA.map(stat => {
        const chars = [...stat.number]
        const charWidths = chars.map(ch =>
            measureNaturalWidth(prepareWithSegments(ch, font))
        )
        const positions = []
        let cx = 0
        for (let i = 0; i < chars.length; i++) {
            positions.push(cx)
            cx += charWidths[i]
        }
        return { ...stat, chars, charWidths, positions, numWidth: cx }
    })
}

function sizeStatsCanvas() {
    if (!statsCanvas || !statsCtx) return
    const dpr = window.devicePixelRatio || 1
    const w = Math.min(1100, statsCanvas.parentElement.clientWidth)
    const h = 110
    statsCanvas.width = w * dpr
    statsCanvas.height = h * dpr
    statsCanvas.style.width = w + 'px'
    statsCanvas.style.height = h + 'px'
    statsCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function renderStats() {
    if (!measuredStats || !statsCtx) return
    const w = parseFloat(statsCanvas.style.width)
    const h = parseFloat(statsCanvas.style.height)
    statsCtx.clearRect(0, 0, w, h)

    const colW = w / measuredStats.length

    for (let si = 0; si < measuredStats.length; si++) {
        const stat = measuredStats[si]
        const colCenter = colW * si + colW / 2
        const numX = colCenter - stat.numWidth / 2

        // Number — per-character rendering (pretext-measured positions)
        statsCtx.font = statNumFont()
        statsCtx.textBaseline = 'alphabetic'
        statsCtx.textAlign = 'left'
        statsCtx.fillStyle = '#E2BA75'
        for (let ci = 0; ci < stat.chars.length; ci++) {
            statsCtx.fillText(stat.chars[ci], numX + stat.positions[ci], 55)
        }

        // Label
        statsCtx.font = statLblFont()
        statsCtx.textAlign = 'center'
        statsCtx.textBaseline = 'top'
        statsCtx.fillStyle = 'rgba(240, 237, 231, 0.45)'
        statsCtx.letterSpacing = '3px'
        statsCtx.fillText(stat.label, colCenter, 72)
        statsCtx.letterSpacing = '0px'
    }
}

document.fonts.ready.then(() => {
    measureStatsPretext()
    sizeStatsCanvas()
    renderStats()
})

const bioSection = document.querySelector('.bio-section')
if (bioSection) {
    const bioPhoto = bioSection.querySelector('.bio-photo-wrap')
    const bioText  = bioSection.querySelector('.bio-text')
    const bioStats = bioSection.querySelector('.bio-stats-wrap')

    const bioObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return
            setTimeout(() => bioPhoto?.classList.add('visible'), BIO.photo)
            setTimeout(() => bioText?.classList.add('visible'),  BIO.text)
            setTimeout(() => bioStats?.classList.add('visible'), BIO.stats)
            bioObserver.unobserve(entry.target)
        })
    }, { threshold: 0.15 })

    bioObserver.observe(bioSection)
}

window.addEventListener('resize', () => {
    const newStatSize = window.innerWidth < 768 ? 40 : 64
    if (newStatSize !== lastStatSize) measureStatsPretext()
    sizeStatsCanvas()
    renderStats()
})

// ── Section 4: Support — Fade In ─────────────────────────

const supportInner = document.querySelector('.support-inner')
if (supportInner) {
    const supportObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => supportInner.classList.add('visible'), 200)
                supportObserver.unobserve(entry.target)
            }
        })
    }, { threshold: 0.2 })
    supportObserver.observe(supportInner)
}

