import { describe, expect, it } from 'vitest';

import { FakeBrowserTarget } from './FakeBrowserTarget';
import { FakeViewportCanvas } from './FakeViewportCanvas';

describe('FakeViewportCanvas', () => {
  it('is laid out at 1280 × 720 by default, with a 0 × 0 drawing size until the host sizes it', () => {
    const canvas = new FakeViewportCanvas();

    expect({
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      width: canvas.width,
      height: canvas.height,
    }).toEqual({ clientWidth: 1280, clientHeight: 720, width: 0, height: 0 });
  });

  it('reports its layout box at the top-left corner of the page', () => {
    const canvas = new FakeViewportCanvas(640, 360);

    expect(canvas.getBoundingClientRect()).toEqual({ left: 0, top: 0, width: 640, height: 360 });
  });

  it('captures, reports and releases pointers by id', () => {
    const canvas = new FakeViewportCanvas();

    canvas.setPointerCapture(1);
    canvas.setPointerCapture(2);
    canvas.releasePointerCapture(1);

    expect([canvas.hasPointerCapture(1), canvas.hasPointerCapture(2)]).toEqual([false, true]);
    expect([...canvas.capturedPointers]).toEqual([2]);
  });

  it('hands back the 2D context it was given, or null for a browser that cannot draw', () => {
    const context = new FakeViewportCanvas().getContext();

    expect(context).not.toBeNull();
    expect(new FakeViewportCanvas(640, 360, context).getContext()).toBe(context);
    expect(new FakeViewportCanvas(640, 360, null).getContext()).toBeNull();
  });

  it('draws nothing through its default context, which starts at the canvas defaults', () => {
    const context = new FakeViewportCanvas().getContext();
    if (context === null) throw new Error('the default canvas has no 2D context');

    const drawEveryShape = (): void => {
      context.save();
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(4, 4);
      context.rect(0, 0, 4, 4);
      context.ellipse(2, 2, 1, 1, 0, 0, Math.PI);
      context.closePath();
      context.clip();
      context.fill();
      context.stroke();
      context.fillRect(0, 0, 4, 4);
      context.strokeRect(0, 0, 4, 4);
      context.restore();
    };

    expect(drawEveryShape).not.toThrow();
    expect({
      fillStyle: context.fillStyle,
      strokeStyle: context.strokeStyle,
      lineWidth: context.lineWidth,
      lineJoin: context.lineJoin,
    }).toEqual({ fillStyle: '', strokeStyle: '', lineWidth: 1, lineJoin: 'miter' });
  });

  it('is a FakeBrowserTarget, so a test can count the listeners on it', () => {
    const canvas = new FakeViewportCanvas();
    const onPointerDown = (): void => undefined;

    canvas.addEventListener('pointerdown', onPointerDown);

    expect(canvas).toBeInstanceOf(FakeBrowserTarget);
    expect(canvas.listenerCount('pointerdown')).toBe(1);
  });
});
