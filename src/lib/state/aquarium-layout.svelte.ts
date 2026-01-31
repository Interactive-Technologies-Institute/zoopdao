export class AquariumLayoutState {
	containerWidth = $state(0);
	containerHeight = $state(0);
	containerLeft = $state(0);
	containerTop = $state(0);
	tableLeft = $state(0);
	tableTop = $state(0);
	tableWidth = $state(0);
	tableHeight = $state(0);
	badgeWidth = $state(0);
	badgeHeight = $state(0);
	safeTopPx = $state(0);
	safeBottomPx = $state(0);

	setContainerSize(width: number, height: number) {
		this.containerWidth = width;
		this.containerHeight = height;
	}

	setContainerRect(left: number, top: number, width: number, height: number) {
		this.containerLeft = left;
		this.containerTop = top;
		this.containerWidth = width;
		this.containerHeight = height;
	}

	setTableRect(left: number, top: number, width: number, height: number) {
		this.tableLeft = left;
		this.tableTop = top;
		this.tableWidth = width;
		this.tableHeight = height;
	}

	setBadgeSize(width: number, height: number) {
		this.badgeWidth = width;
		this.badgeHeight = height;
	}

	setSafeArea(topPx: number, bottomPx: number) {
		this.safeTopPx = topPx;
		this.safeBottomPx = bottomPx;
	}
}
