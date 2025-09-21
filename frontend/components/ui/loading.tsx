import * as React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';
import { VariantProps, cva } from 'class-variance-authority';

const loadingVariants = cva('flex items-center justify-center transition-colors', {
	variants: {
		variant: {
			default: 'gap-2 p-4',
			overlay: 'absolute inset-0 bg-background/85 backdrop-blur-sm z-50 gap-3 border border-border/20 rounded-lg',
			inline: 'gap-2 p-2',
			fullscreen: 'fixed inset-0 bg-background/90 backdrop-blur-md z-50 gap-4',
		},
		size: {
			sm: 'text-sm',
			default: 'text-base',
			lg: 'text-lg',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'default',
	},
});

export interface LoadingProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof loadingVariants> {
	/**
	 * Text to display alongside the spinner
	 */
	text?: string;
	/**
	 * Size of the spinner
	 */
	spinnerSize?: 'sm' | 'default' | 'lg' | 'xl';
	/**
	 * Whether to show the loading state
	 */
	isLoading?: boolean;
	/**
	 * Children to render when not loading (for wrapping components)
	 */
	children?: React.ReactNode;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
	(
		{
			className,
			variant,
			size,
			text,
			spinnerSize,
			isLoading = true,
			children,
			...props
		},
		ref
	) => {
		// If not loading and has children, render children only
		if (!isLoading && children) {
			return <>{children}</>;
		}

		// If not loading and no children, render nothing
		if (!isLoading) {
			return null;
		}

		return (
			<div
				ref={ref}
				className={cn(loadingVariants({ variant, size }), className)}
				{...props}
			>
				<Spinner size={spinnerSize} />
				{text && (
					<span className="text-muted-foreground font-medium select-none">
						{text}
					</span>
				)}
			</div>
		);
	}
);
Loading.displayName = 'Loading';

export { Loading, loadingVariants };