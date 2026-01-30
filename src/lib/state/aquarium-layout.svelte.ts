export class AquariumLayoutState {
	containerWidth = $state(0);
	containerHeight = $state(0);

	setContainerSize(width: number, height: number) {
		this.containerWidth = width;
		this.containerHeight = height;
	}
}
