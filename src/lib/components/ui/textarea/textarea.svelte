<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { WithElementRef, WithoutChildren } from 'bits-ui';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type TextareaProps = WithoutChildren<WithElementRef<HTMLTextareaAttributes>> & {
		autoResize?: boolean;
		minRows?: number;
		maxRows?: number;
	};

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		autoResize = true,
		minRows = 3,
		maxRows = 9,
		oninput: onInput,
		...restProps
	}: TextareaProps = $props();

	// If caller sets a `rows` prop but not `minRows`, assume they want that as the minimum.
	const rowsProp = restProps.rows;
	if (typeof rowsProp === 'number' && minRows === 3) minRows = rowsProp;
	if (typeof rowsProp === 'string' && minRows === 3) {
		const parsed = Number.parseInt(rowsProp, 10);
		if (!Number.isNaN(parsed)) minRows = parsed;
	}
	if (maxRows < minRows) maxRows = minRows;

	function resizeToContent() {
		if (!autoResize) return;
		if (typeof window === 'undefined') return;
		const textarea = ref as HTMLTextAreaElement | null;
		if (!textarea) return;

		const style = window.getComputedStyle(textarea);
		const lineHeight = Number.parseFloat(style.lineHeight) || 20;
		const paddingTop = Number.parseFloat(style.paddingTop) || 0;
		const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;

		const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
		const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

		textarea.style.height = 'auto';
		const nextHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
		textarea.style.height = `${nextHeight}px`;
		textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
	}

	$effect(() => {
		// track value + row bounds, then resize after DOM updates
		value;
		minRows;
		maxRows;

		queueMicrotask(resizeToContent);
	});
</script>

<textarea
	bind:this={ref}
	class={cn(
		'border-deep-teal bg-white ring-offset-white placeholder:text-text placeholder:opacity-50 focus-visible:ring-deep-teal flex w-full resize-none rounded-md border px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
		className
	)}
	bind:value
	rows={minRows}
	oninput={(e) => {
		onInput?.(e);
		resizeToContent();
	}}
	{...restProps}
></textarea>
