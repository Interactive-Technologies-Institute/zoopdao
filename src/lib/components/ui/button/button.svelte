<script lang="ts" module>
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'ring-offset-background focus-visible:ring-focus inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
		variants: {
			variant: {
				default:
					'bg-primary text-white hover:bg-primary-hover active:bg-primary-active disabled:bg-primary-disabled',
				destructive:
					'bg-primary text-white hover:bg-primary-hover active:bg-primary-active disabled:bg-primary-disabled',
				outline: 'border-primary text-primary bg-transparent hover:bg-primary/10 border',
				secondary:
					'bg-secondary text-white hover:bg-secondary-hover active:bg-secondary-active disabled:bg-primary-disabled',
				ghost: 'text-text hover:bg-tertiary/40',
				link: 'text-primary underline-offset-4 hover:underline'
			},
			size: {
				default: 'h-10 px-4 py-2',
				lg: 'h-12 rounded-md px-8 text-base',
				icon: 'h-10 w-10 rounded-full',
				'icon-lg': 'h-12 w-12 [&_svg]:size-5 rounded-full '
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a bind:this={ref} class={cn(buttonVariants({ variant, size, className }))} {href} {...restProps}>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		class={cn(buttonVariants({ variant, size, className }))}
		{type}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
