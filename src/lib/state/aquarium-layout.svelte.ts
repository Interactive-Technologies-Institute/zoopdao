export class AquariumLayoutState {
	containerWidth = $state(0);
	containerHeight = $state(0);
	aquariumRect = $state({ x: 0, y: 0, width: 0, height: 0 });

	setContainerSize(width: number, height: number) {
		this.containerWidth = width;
		this.containerHeight = height;
	}

	setAquariumRect(x: number, y: number, width: number, height: number) {
		this.aquariumRect = { x, y, width, height };
	}
}
