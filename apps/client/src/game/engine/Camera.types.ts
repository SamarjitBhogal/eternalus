/** The sizes a projection needs: the world in world units and the screen in device pixels. */
export type Viewport = {
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly screenWidth: number;
  readonly screenHeight: number;
};
