"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import Button from "@/components/ui/Button";

/* ---------------- Magazine Flip (inline, JS only) ---------------- */

const CAM_FOV = 75;
const CAM_Z = 6;
const VIEW_HEIGHT = 2 * CAM_Z * Math.tan((CAM_FOV * Math.PI) / 360);
const PAGE_SEGMENTS = 40;
const MAX_PAGES = 60;
const THICKNESS_RATIO = 0.005;
const CELL_MAX = 512;
const ATLAS_MAX = 4096;
const PLACEHOLDER_ASPECTS = [0.72, 1.5, 0.78, 1.33, 1.0, 1.62, 0.68, 1.2, 0.86, 1.45];
const PLACEHOLDER_COUNT = 10;
const CORRIDOR_DIM = 0.22;
const TAP_SLOP = 6;
const TAP_MS = 600;
const PICK_MAX = 1600;

const DEFAULT_VIEW = { tap: true, zoom: 5, speed: 5 };
const DEFAULT_TRAVEL = { drift: 2, smoothing: 5, wave: 5 };

const DEFAULTS = {
  pages: 16,
  spacing: 5,
  tilt: 0,
  turn: 0,
  pageWidth: 420,
  pageHeight: 340,
  scrollSens: 5,
};

function clamp(v, lo, hi, fallback) {
  const n = typeof v === "number" && isFinite(v) ? v : fallback;
  return Math.max(lo, Math.min(hi, n));
}

function power2InOut(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function settingsFor(cfg, viewWidthPx, viewHeightPx) {
  const worldPerPx = VIEW_HEIGHT / Math.max(1, viewHeightPx);
  const viewAspect = Math.max(1, viewWidthPx) / Math.max(1, viewHeightPx);
  const pageWidthPx = clamp(cfg.pageWidth, 40, 1200, DEFAULTS.pageWidth);
  const pageHeightPx = clamp(cfg.pageHeight, 40, 1600, DEFAULTS.pageHeight);
  const pageWidth = pageWidthPx * worldPerPx;
  const pageHeight = pageHeightPx * worldPerPx;
  const spacing = clamp(cfg.spacing, 0, 10, DEFAULTS.spacing);
  const smoothing = clamp(cfg.travel.smoothing, 0, 10, DEFAULT_TRAVEL.smoothing);
  const wave = clamp(cfg.travel.wave, 0, 10, DEFAULT_TRAVEL.wave);
  const drift = clamp(cfg.travel.drift, -10, 10, DEFAULT_TRAVEL.drift);

  const focusZ = Math.min(CAM_Z * 0.55, pageWidth * 0.75);
  const planeHeight = (VIEW_HEIGHT * (CAM_Z - focusZ)) / CAM_Z;
  const planeWidth = planeHeight * viewAspect;
  const fill = 0.6 + clamp(cfg.view.zoom, 0, 10, DEFAULT_VIEW.zoom) * 0.04;

  return {
    pageWidth,
    pageHeight,
    pageWidthPx,
    pageHeightPx,
    worldPerPx,
    pages: Math.round(clamp(cfg.pages, 4, MAX_PAGES, DEFAULTS.pages)),
    pageSpacing: pageWidth * (0.1 + spacing * 0.08),
    thickness: pageWidth * THICKNESS_RATIO,
    tilt: (clamp(cfg.tilt, -45, 45, DEFAULTS.tilt) * Math.PI) / 180,
    turn: (clamp(cfg.turn, -60, 60, DEFAULTS.turn) * Math.PI) / 180,
    wave: pageWidth * 0.04 * wave,
    lerp: 0.35 * Math.pow(0.82, smoothing),
    driftPerSecond: drift * pageWidth * 0.15,
    wheel: 0.4 + clamp(cfg.scrollSens, 0, 10, DEFAULTS.scrollSens) * 0.16,
    tapToView: cfg.view.tap !== false,
    focusZ,
    focusScale: Math.min(
      (planeHeight * fill) / pageHeight,
      (planeWidth * fill) / pageWidth,
    ),
    viewDuration: 1.6 - clamp(cfg.view.speed, 0, 10, DEFAULT_VIEW.speed) * 0.13,
  };
}

const PAGE_VERTEX = `
attribute float aIndex;
attribute vec4 aRect;
attribute float aAspect;
attribute float aOffset;

uniform float uPageThickness;
uniform float uPageWidth;
uniform float uPageHeight;
uniform float uMeshCount;
uniform float uPageSpacing;
uniform float uScrollY;
uniform float uSpeedY;
uniform float uWave;
uniform float uTilt;
uniform float uTurn;
uniform float uFocusIndex;
uniform float uFocusProgress;
uniform float uFocusScale;
uniform float uFocusZ;

varying vec2 vUv;
varying vec4 vRect;
varying float vAspect;
varying float vOffset;
varying float vIndex;
varying float vDim;

const float TAU_HALF = 3.14159265359;

mat3 rotY(float a) {
    return mat3(cos(a), 0.0, sin(a), 0.0, 1.0, 0.0, -sin(a), 0.0, cos(a));
}

mat3 rotX(float a) {
    return mat3(1.0, 0.0, 0.0, 0.0, cos(a), -sin(a), 0.0, sin(a), cos(a));
}

void main() {
    float PI = TAU_HALF;

    vec3 basePos = vec3(
        position.x * uPageWidth,
        position.y * uPageHeight,
        position.z * uPageThickness
    );

    vec3 rotationCenter = vec3(-uPageWidth * 0.5, 0.0, 0.0);

    float fromMiddle = aIndex - (uMeshCount - 1.0) * 0.5;

    float yAngle = -PI * 0.5 + uTurn;
    float xAngle = uTilt;

    float boxCenterZ = uPageSpacing * (-fromMiddle);
    float maxZ = uMeshCount * (uPageSpacing + uPageThickness) * 0.5;

    float bow = sin((position.y + 0.5) * 2.0) * uWave;
    float speed = clamp(uSpeedY / uPageWidth * 4.0, -2.0, 2.0);

    float zCorridor = mod(boxCenterZ - uScrollY + maxZ, 2.0 * maxZ) - maxZ
        - bow * speed;

    float focused = step(abs(aIndex - uFocusIndex), 0.5);
    float e = focused * uFocusProgress;

    float k = mix(1.0, uFocusScale, e);
    vec3 pivot = rotationCenter * (1.0 - e);

    vec3 vertexLocal = basePos * k - pivot;
    vertexLocal.z += zCorridor * (1.0 - e);

    vec3 rotated = rotY(yAngle * (1.0 - e)) * vertexLocal + pivot;

    rotated.z -= uPageWidth * 0.5 * (1.0 - e);
    rotated.x += uPageWidth * 0.5 * (1.0 - e);

    vec3 newPosition = rotX(xAngle * (1.0 - e)) * rotated;
    newPosition.z += uFocusZ * e;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    vUv = uv;
    vRect = aRect;
    vAspect = aAspect;

    vOffset = aOffset;
    vIndex = aIndex;

    vDim = uFocusProgress * (1.0 - focused);
}
`;

const PAGE_FRAGMENT = `
uniform sampler2D uAtlas;
uniform float uPageAspect;

varying vec2 vUv;
varying vec4 vRect;
varying float vAspect;
varying float vOffset;
varying float vDim;

void main() {
    vec2 uv = vUv;
    float s = vAspect / uPageAspect;

    float band = min(s, 1.0 / s);
    float slack = (1.0 - band) * 0.5;
    float slide = clamp(vOffset, -1.0, 1.0) * slack;
    if (s >= 1.0) {
        uv.x = (uv.x - 0.5) * band + 0.5 - slide;
    } else {
        uv.y = (uv.y - 0.5) * band + 0.5 + slide;
    }

    vec2 atlasUv = mix(vRect.xy, vRect.zw, clamp(uv, 0.0, 1.0));
    vec4 color = texture2D(uAtlas, atlasUv);

    gl_FragColor = vec4(color.rgb * mix(1.0, ${CORRIDOR_DIM.toFixed(2)}, vDim), color.a);
}
`;

const PICK_FRAGMENT = `
varying float vIndex;

void main() {
    gl_FragColor = vec4((vIndex + 1.0) / 255.0, 0.0, 0.0, 1.0);
}
`;

const imageCache = new Map();
const imagePending = new Map();

function loadImage(url) {
  if (imageCache.has(url)) return Promise.resolve(imageCache.get(url) ?? null);
  const pending = imagePending.get(url);
  if (pending) return pending;
  const p = new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      imageCache.set(url, null);
      resolve(null);
    };
    img.src = url;
  });
  imagePending.set(url, p);
  return p;
}

function drawPlaceholder(ctx, index, x, y, w, h) {
  const hue = (index * 47) % 360;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, `hsl(${hue}, 22%, 27%)`);
  grad.addColorStop(0.55, `hsl(${hue}, 18%, 13%)`);
  grad.addColorStop(1, `hsl(${(hue + 40) % 360}, 24%, 23%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

async function buildAtlas(sources, maxAnisotropy) {
  const n = Math.max(1, sources.length);
  const images = await Promise.all(
    sources.map((src) => (src ? loadImage(src) : Promise.resolve(null))),
  );

  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cell = Math.min(CELL_MAX, Math.floor(ATLAS_MAX / Math.max(cols, rows)));
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const paint = (useImages) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cells = [];
    for (let i = 0; i < n; i++) {
      const cx = (i % cols) * cell;
      const cy = Math.floor(i / cols) * cell;
      const img = useImages ? images[i] : null;
      const aspect =
        img && img.naturalHeight > 0
          ? img.naturalWidth / img.naturalHeight
          : PLACEHOLDER_ASPECTS[i % PLACEHOLDER_ASPECTS.length];

      const w = aspect >= 1 ? cell : cell * aspect;
      const h = aspect >= 1 ? cell / aspect : cell;
      const dx = cx + (cell - w) / 2;
      const dy = cy + (cell - h) / 2;
      if (img) ctx.drawImage(img, dx, dy, w, h);
      else drawPlaceholder(ctx, i, dx, dy, w, h);

      const u0 = (dx + 1) / canvas.width;
      const u1 = (dx + w - 1) / canvas.width;
      const vTop = 1 - (dy + 1) / canvas.height;
      const vBottom = 1 - (dy + h - 1) / canvas.height;
      cells.push({ rect: [u0, vBottom, u1, vTop], aspect });
    }
    return cells;
  };

  let cells = paint(true);
  try {
    ctx.getImageData(0, 0, 1, 1);
  } catch {
    cells = paint(false);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return { texture, cells };
}

function blankTexture() {
  const t = new THREE.DataTexture(
    new Uint8Array([46, 46, 48, 255]),
    1,
    1,
    THREE.RGBAFormat,
  );
  t.needsUpdate = true;
  return t;
}

class MagazineScene {
  constructor(container, cfg) {
    this.container = container;
    this.cfg = cfg;
    this.scene = new THREE.Scene();
    this.atlas = null;
    this.pickTarget = new THREE.WebGLRenderTarget(1, 1);
    this.pickBuffer = new Uint8Array(4);
    this.width = 1;
    this.height = 1;
    this.frameId = 0;
    this.lastT = 0;
    this.disposed = false;
    this.atlasToken = 0;
    this.atlasKey = "";
    this.scroll = { target: 0, current: 0, speed: 0 };
    this.drag = { active: false, lastX: 0, id: -1 };
    this.focus = { index: -1, t: 0, target: 0 };
    this.tap = { x: 0, y: 0, at: 0, id: -1, hit: -1 };
    this.settingsCache = null;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    container.appendChild(canvas);

    this.camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 200);
    this.camera.position.z = CAM_Z;
    this.scene.add(this.camera);

    this.blank = blankTexture();

    this.geometry = new THREE.BoxGeometry(1, 1, 1, PAGE_SEGMENTS, PAGE_SEGMENTS, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader: PAGE_VERTEX,
      fragmentShader: PAGE_FRAGMENT,
      transparent: true,
      uniforms: {
        uPageThickness: { value: 0.01 },
        uPageWidth: { value: 2 },
        uPageHeight: { value: 3 },
        uMeshCount: { value: DEFAULTS.pages },
        uPageSpacing: { value: 1 },
        uScrollY: { value: 0 },
        uSpeedY: { value: 0 },
        uWave: { value: 0.4 },
        uTilt: { value: 0 },
        uTurn: { value: 0 },
        uFocusIndex: { value: -1 },
        uFocusProgress: { value: 0 },
        uFocusScale: { value: 1 },
        uFocusZ: { value: 0 },
        uPageAspect: { value: 2 / 3 },
        uAtlas: { value: this.blank },
      },
    });

    this.pickMaterial = new THREE.ShaderMaterial({
      vertexShader: PAGE_VERTEX,
      fragmentShader: PICK_FRAGMENT,
      uniforms: this.material.uniforms,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, MAX_PAGES);
    this.mesh.frustumCulled = false;

    const index = new Float32Array(MAX_PAGES);
    for (let i = 0; i < MAX_PAGES; i++) index[i] = i;
    this.geometry.setAttribute("aIndex", new THREE.InstancedBufferAttribute(index, 1));
    this.rectAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PAGES * 4), 4);
    this.aspectAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PAGES).fill(1), 1);
    this.offsetAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PAGES), 1);
    this.geometry.setAttribute("aRect", this.rectAttr);
    this.geometry.setAttribute("aAspect", this.aspectAttr);
    this.geometry.setAttribute("aOffset", this.offsetAttr);

    for (let i = 0; i < MAX_PAGES; i++) this.rectAttr.setXYZW(i, 0, 0, 1, 1);
    this.rectAttr.needsUpdate = true;

    this.scene.add(this.mesh);

    this.onKeyDown = (event) => {
      if (event.key === "Escape" && this.focus.index >= 0) this.focus.target = 0;
    };

    this.onWheel = (event) => {
      if (this.disposed) return;
      if (this.focus.index >= 0) return;
      // Only horizontal gestures are captured, so vertical page scroll still works
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) && !event.shiftKey) return;
      event.preventDefault();
      const scale = this.wheelScale(event);
      const raw = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      const S = this.settings();
      this.push(raw * scale * S.worldPerPx * S.wheel);
    };

    this.onPointerDown = (event) => {
      if (this.disposed || event.button !== 0) return;
      this.tap = {
        x: event.clientX,
        y: event.clientY,
        at: performance.now(),
        id: event.pointerId,
        hit:
          this.focus.index < 0 && this.settings().tapToView
            ? this.pick(event.clientX, event.clientY)
            : -1,
      };
      this.container.setPointerCapture?.(event.pointerId);
      if (this.focus.index >= 0) return;
      this.drag.active = true;
      this.drag.lastX = event.clientX;
      this.drag.id = event.pointerId;
    };

    this.onPointerMove = (event) => {
      if (!this.drag.active || event.pointerId !== this.drag.id) return;
      const delta = this.drag.lastX - event.clientX;
      this.drag.lastX = event.clientX;
      const S = this.settings();
      this.push(delta * 2 * S.worldPerPx * S.wheel);
    };

    this.onPointerUp = (event) => {
      if (event.pointerId === this.drag.id) {
        this.drag.active = false;
        this.drag.id = -1;
      }
      if (event.pointerId !== this.tap.id) return;
      this.container.releasePointerCapture?.(event.pointerId);
      this.tap.id = -1;
      const moved = Math.hypot(event.clientX - this.tap.x, event.clientY - this.tap.y);
      if (moved <= TAP_SLOP && performance.now() - this.tap.at <= TAP_MS) {
        this.onTap(this.tap.hit);
      }
    };

    this.onPointerCancel = (event) => {
      if (event.pointerId === this.drag.id) {
        this.drag.active = false;
        this.drag.id = -1;
      }
      if (event.pointerId === this.tap.id) {
        this.container.releasePointerCapture?.(event.pointerId);
        this.tap.id = -1;
      }
    };

    this.applyConfig();
    this.loadAtlas();
  }

  applyConfig() {
    const S = this.settings();
    const u = this.material.uniforms;
    this.mesh.count = S.pages;
    u.uMeshCount.value = S.pages;
    u.uPageWidth.value = S.pageWidth;
    u.uPageHeight.value = S.pageHeight;
    u.uPageThickness.value = S.thickness;
    u.uPageSpacing.value = S.pageSpacing;
    u.uWave.value = S.wave;
    u.uTilt.value = S.tilt;
    u.uTurn.value = S.turn;
    u.uPageAspect.value = S.pageWidthPx / S.pageHeightPx;
    u.uFocusScale.value = S.focusScale;
    u.uFocusZ.value = S.focusZ;
    for (let i = 0; i < MAX_PAGES; i++) this.offsetAttr.setX(i, 0);
    this.offsetAttr.needsUpdate = true;
    if (this.focus.index >= S.pages || !S.tapToView) this.clearFocus();
  }

  clearFocus() {
    this.focus.index = -1;
    this.focus.t = 0;
    this.focus.target = 0;
    this.material.uniforms.uFocusIndex.value = -1;
    this.material.uniforms.uFocusProgress.value = 0;
  }

  writeCells() {
    const cells = this.atlas?.cells;
    if (!cells || !cells.length) return;
    for (let i = 0; i < MAX_PAGES; i++) {
      const c = cells[i % cells.length];
      this.rectAttr.setXYZW(i, c.rect[0], c.rect[1], c.rect[2], c.rect[3]);
      this.aspectAttr.setX(i, c.aspect);
    }
    this.rectAttr.needsUpdate = true;
    this.aspectAttr.needsUpdate = true;
  }

  sourceList() {
    const list = this.cfg.images;
    if (list && list.length) return list.map((item) => item?.src || "");
    return Array.from({ length: PLACEHOLDER_COUNT }, () => "");
  }

  loadAtlas() {
    const sources = this.sourceList();
    const key = sources.join("|");
    if (key === this.atlasKey) return;
    this.atlasKey = key;
    const token = ++this.atlasToken;
    buildAtlas(sources, this.renderer.capabilities.getMaxAnisotropy())
      .then((atlas) => {
        if (this.disposed || token !== this.atlasToken) {
          atlas?.texture.dispose();
          return;
        }
        this.atlas?.texture.dispose();
        this.atlas = atlas;
        if (atlas) {
          this.material.uniforms.uAtlas.value = atlas.texture;
          this.writeCells();
        }
      })
      .catch(() => { });
  }

  settings() {
    if (!this.settingsCache) {
      this.settingsCache = settingsFor(this.cfg, this.width, this.height);
    }
    return this.settingsCache;
  }

  pick(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return -1;
    const u = (clientX - rect.left) / rect.width;
    const v = (clientY - rect.top) / rect.height;
    if (u < 0 || v < 0 || u >= 1 || v >= 1) return -1;

    const scale = Math.min(1, PICK_MAX / Math.max(this.width, this.height));
    const tw = Math.max(1, Math.round(this.width * scale));
    const th = Math.max(1, Math.round(this.height * scale));
    if (this.pickTarget.width !== tw || this.pickTarget.height !== th) {
      this.pickTarget.setSize(tw, th);
    }

    const previous = this.mesh.material;
    this.mesh.material = this.pickMaterial;
    this.renderer.setRenderTarget(this.pickTarget);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.render(this.scene, this.camera);
    this.renderer.readRenderTargetPixels(
      this.pickTarget,
      Math.min(tw - 1, Math.floor(u * tw)),
      Math.min(th - 1, Math.floor((1 - v) * th)),
      1,
      1,
      this.pickBuffer,
    );
    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(0x000000, 0);
    this.mesh.material = previous;

    const hit = this.pickBuffer[0] - 1;
    return hit >= 0 && hit < this.settings().pages ? hit : -1;
  }

  onTap(hit) {
    if (!this.settings().tapToView) return;
    if (this.focus.index >= 0) {
      this.focus.target = 0;
      return;
    }
    if (hit >= 0) {
      this.focus.index = hit;
      this.focus.target = 1;
    }
  }

  wheelScale(event) {
    if (event.deltaMode === 1) return 16;
    if (event.deltaMode === 2) return this.height;
    return 1;
  }

  push(worldDelta) {
    if (!isFinite(worldDelta)) return;
    this.scroll.target += worldDelta;
    this.scroll.speed += worldDelta;
  }

  attach() {
    const node = this.container;
    node.addEventListener("wheel", this.onWheel, { passive: false });
    node.addEventListener("pointerdown", this.onPointerDown);
    node.addEventListener("pointermove", this.onPointerMove);
    node.addEventListener("pointerup", this.onPointerUp);
    node.addEventListener("pointercancel", this.onPointerCancel);
    window.addEventListener("keydown", this.onKeyDown);
  }

  detach() {
    const node = this.container;
    node.removeEventListener("wheel", this.onWheel);
    node.removeEventListener("pointerdown", this.onPointerDown);
    node.removeEventListener("pointermove", this.onPointerMove);
    node.removeEventListener("pointerup", this.onPointerUp);
    node.removeEventListener("pointercancel", this.onPointerCancel);
    window.removeEventListener("keydown", this.onKeyDown);
  }

  setSize(width, height) {
    if (this.disposed) return;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.settingsCache = null;
    this.applyConfig();
  }

  updateConfig(cfg) {
    if (this.disposed) return;
    this.cfg = cfg;
    this.settingsCache = null;
    this.loadAtlas();
    this.applyConfig();
    this.writeCells();
  }

  setCursor(value) {
    if (this.container.style.cursor === value) return;
    this.container.style.cursor = value;
  }

  start() {
    this.attach();
    this.lastT = performance.now();
    const loop = () => {
      if (this.disposed) return;
      this.frameId = requestAnimationFrame(loop);
      this.step();
    };
    this.frameId = requestAnimationFrame(loop);
  }

  step() {
    const now = performance.now();
    let dt = (now - this.lastT) / 1000;
    this.lastT = now;
    if (!isFinite(dt) || dt < 0) dt = 0;
    if (dt > 0.05) dt = 0.05;

    const S = this.settings();
    const u = this.material.uniforms;

    if (this.focus.index >= 0) {
      const rate = dt / Math.max(0.05, S.viewDuration);
      this.focus.t = Math.min(1, Math.max(0, this.focus.t + (this.focus.target ? rate : -rate)));
      if (this.focus.t === 0 && this.focus.target === 0) this.focus.index = -1;
    }
    u.uFocusIndex.value = this.focus.index;
    u.uFocusProgress.value = power2InOut(this.focus.t);

    this.setCursor(this.focus.index >= 0 && this.focus.target === 1 ? "zoom-out" : "grab");

    // Auto drift (paused while a page is opened or being dragged)
    if (S.driftPerSecond !== 0 && this.focus.index < 0 && !this.drag.active) {
      this.push(S.driftPerSecond * dt);
    }

    const k = dt * 60;
    const ease = 1 - Math.pow(1 - S.lerp, k);
    this.scroll.current += (this.scroll.target - this.scroll.current) * ease;
    this.scroll.speed *= Math.pow(0.835, k);

    const period = S.pages * (S.pageSpacing + S.thickness);
    if (Math.abs(this.scroll.current) > period) {
      const wrap = Math.sign(this.scroll.current) * period;
      this.scroll.current -= wrap;
      this.scroll.target -= wrap;
    }

    u.uScrollY.value = this.scroll.current;
    u.uSpeedY.value = this.scroll.speed;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    this.detach();
    this.geometry.dispose();
    this.material.dispose();
    this.pickMaterial.dispose();
    this.pickTarget.dispose();
    this.blank.dispose();
    this.atlas?.texture.dispose();
    this.mesh.dispose();
    this.renderer.dispose();
    const canvas = this.renderer.domElement;
    canvas.parentNode?.removeChild(canvas);
  }
}

function MagazineFlip({
  images = [],
  background = "transparent",
  pages = DEFAULTS.pages,
  spacing = DEFAULTS.spacing,
  tilt = DEFAULTS.tilt,
  turn = DEFAULTS.turn,
  pageWidth = DEFAULTS.pageWidth,
  pageHeight = DEFAULTS.pageHeight,
  view,
  scrollSens = DEFAULTS.scrollSens,
  travel,
  style,
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cfgRef = useRef(null);

  const cfg = {
    images: Array.isArray(images) ? images : [],
    pages,
    spacing,
    tilt,
    turn,
    pageWidth,
    pageHeight,
    view: { ...DEFAULT_VIEW, ...view },
    scrollSens,
    travel: { ...DEFAULT_TRAVEL, ...travel },
  };
  cfgRef.current = cfg;

  const imageKey = cfg.images.map((item) => item?.src || "").join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let scene;
    try {
      scene = new MagazineScene(container, cfgRef.current);
    } catch {
      return undefined;
    }
    sceneRef.current = scene;
    scene.setSize(container.clientWidth, container.clientHeight);
    scene.start();

    const ro = new ResizeObserver(() => {
      scene.setSize(container.clientWidth, container.clientHeight);
    });
    ro.observe(container);
    return () => {
      ro.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.updateConfig(cfgRef.current);
  }, [
    imageKey,
    pages,
    spacing,
    tilt,
    turn,
    pageWidth,
    pageHeight,
    scrollSens,
    cfg.view.tap,
    cfg.view.zoom,
    cfg.view.speed,
    cfg.travel.drift,
    cfg.travel.smoothing,
    cfg.travel.wave,
  ]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Resort vignettes: a corridor of photos you can drag through, and tap to open one"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 200,
        minHeight: 200,
        overflow: "hidden",
        background,
        cursor: "grab",
        touchAction: "pan-y",
        ...style,
      }}
    />
  );
}

/* ---------------- Section wrapper ---------------- */

function uniqueBySrc(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item?.src || seen.has(item.src)) continue;
    seen.add(item.src);
    out.push(item);
  }
  return out;
}

export default function ResortVignettesCarousel({ items = [] }) {
  const unique = useMemo(() => uniqueBySrc(items), [items]);

  if (!unique.length) {
    return (
      <div className="mt-10 rounded-2xl border border-line bg-elevated/60 px-6 py-12 text-center text-sm text-muted">
        Gallery previews will load shortly.
      </div>
    );
  }

  return (
    <div className="mt-4 sm:mt-6 space-y-5">
      <div className="h-[440px] w-full sm:h-[520px] lg:h-[600px]">
        <MagazineFlip
          images={unique}
          background="transparent"
          pages={Math.min(20, Math.max(8, unique.length))}
          pageWidth={500}
          pageHeight={400}
          spacing={5}
          travel={{ drift: 2, smoothing: 5, wave: 5 }}
        />
      </div>

      <div className="flex justify-center">
        <Button href="/gallery" variant="secondary">
          View full gallery
        </Button>
      </div>
    </div>
  );
}