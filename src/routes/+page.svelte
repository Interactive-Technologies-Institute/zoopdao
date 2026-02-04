<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { m } from '../paraglide/messages.js';
	import { setLocale, getLocale, localizeUrl } from '../paraglide/runtime.js';
	import type { Locale } from '../paraglide/runtime.js';
	import clickSound from '@/sounds/click.mp3';
	import { onMount } from 'svelte';
	import {
		getVotingPeriods,
		getExceptionalVotingPeriods,
		getProposalStatus
	} from '$lib/data/voting-periods';
	import {
		Circle,
		CheckCircle2,
		ChevronsUpDown,
		Check,
		ChevronDown,
		ChevronUp
	} from 'lucide-svelte';
	import { ZOOP_THEME, resolveZoopTheme, ZOOP_THEME_ASSET_PREFIX } from '$lib/config/theme';
	import { ROLES, type Role } from '$lib/types';
	import { Select } from 'bits-ui';
	import { supabase } from '@/supabase';

	let { data } = $props();

	let click_sound: HTMLAudioElement;

	onMount(() => {
		click_sound = new Audio(clickSound);
		click_sound.volume = 0.5;
	});

	const proposals = $derived(data.proposals || []);
	const currentYear = new Date().getFullYear();
	const votingPeriods = [...getVotingPeriods(currentYear), ...getExceptionalVotingPeriods()];
	const currentLocale = $derived(getLocale() as string);

	function getVotingPeriodLabel(periodId: string): string {
		const period = votingPeriods.find((p) => p.id === periodId);
		return period?.label || periodId;
	}

	function getProposalStatusIcon(status: 'open' | 'closed') {
		return status === 'open' ? CheckCircle2 : Circle;
	}

	function getProposalStatusColor(status: 'open' | 'closed'): string {
		return status === 'open' ? 'text-green-600' : 'text-gray-400';
	}

	function getProposalStatusText(status: 'open' | 'closed'): string {
		return status === 'open' ? m.proposal_status_open() : m.proposal_status_closed();
	}

	function translateProposal(proposal: any, targetLang: string): any {
		// If proposal is already in target language, return as is
		if (!proposal.language || proposal.language === targetLang) {
			return proposal;
		}

		// For now, return original (translation will be implemented later with translation API/service)
		// TODO: Implement actual translation logic using translation API or service
		// This could translate: title, objectives, functionalities, discussion
		return proposal;
	}

	function handleProposalClick(proposalId: number) {
		click_sound.play();
		goto(localizeUrl(`/proposals/${proposalId}/preview`).toString());
	}

	function handleBrowseDiscussions() {
		click_sound.play();
		goto(localizeUrl('/stories').toString());
	}

	let selectedLanguage = $state(getLocale()); // Default language

	// List of available languages
	const languages = [
		{ code: 'en', label: '🇬🇧 English' },
		{ code: 'pt', label: '🇵🇹 Português' }
	];

	// Function to change the language
	function changeLanguage(lang: Locale) {
		selectedLanguage = lang;
		setLocale(lang); // Update the locale using the Paraglide runtime
	}

	const activeTheme = resolveZoopTheme(ZOOP_THEME);
	function getHomeIllustrationSrc(name: string) {
		return activeTheme === 'bos'
			? `${ZOOP_THEME_ASSET_PREFIX}/illustrations/${name}_blop.svg`
			: `/images/illustrations/${name}.png`;
	}

	type OnboardingStep = 'welcome' | 'role' | 'profile' | 'actions';
	type OnboardingData = {
		version: 1;
		role: Role | 'other' | null;
		customRole: string;
		name: string;
		description: string;
		completed: boolean;
	};

	const ONBOARDING_KEY = 'zoopdao:onboarding:v1';
	let onboardingStep = $state<OnboardingStep>('welcome');
	const isActionsStep = $derived(onboardingStep === 'actions');
	let selectedRole = $state<Role | 'other' | ''>('');
	let customRole = $state('');
	let profileName = $state('');
	let profileDescription = $state('');

	function safeJsonParse<T>(raw: string | null): T | null {
		if (!raw) return null;
		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	function loadOnboardingFromStorage(): OnboardingData | null {
		if (typeof window === 'undefined') return null;
		return safeJsonParse<OnboardingData>(localStorage.getItem(ONBOARDING_KEY));
	}

	function persistOnboardingToStorage(next: OnboardingData) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(ONBOARDING_KEY, JSON.stringify(next));
	}

	function bootstrapOnboarding() {
		const stored = loadOnboardingFromStorage();
		if (!stored) {
			onboardingStep = 'welcome';
			return;
		}

		selectedRole = (stored.role ?? '') as Role | '';
		customRole = stored.customRole ?? '';
		profileName = stored.name ?? '';
		profileDescription = stored.description ?? '';

		onboardingStep = stored.completed ? 'actions' : stored.role ? 'profile' : 'role';
	}

	function getRoleLabel(role: Role): string {
		const key = `character_${role}_title` as keyof typeof m;
		const translation = m[key];
		return typeof translation === 'function' ? translation() : role;
	}

	function otherLabel() {
		return getLocale() === 'pt' ? 'Outro' : 'Other';
	}

	const roleOptions = $derived.by(() => {
		const items = ROLES.map((r) => ({
			value: r,
			label: getRoleLabel(r)
		}))
			.slice()
			.sort((a, b) =>
				a.label.localeCompare(b.label, getLocale() === 'pt' ? 'pt-PT' : 'en', {
					sensitivity: 'base'
				})
			);

		// Keep "Other" at the end.
		items.push({ value: 'other' as const, label: otherLabel() });
		return items;
	});

	const rolePlaceholder = $derived.by(() => (getLocale() === 'pt' ? 'Seleciona...' : 'Select...'));
	const selectedRoleLabel = $derived.by(() =>
		selectedRole === 'other'
			? customRole.trim() || otherLabel()
			: selectedRole
				? getRoleLabel(selectedRole as Role)
				: rolePlaceholder
	);

	const canContinueRoleStep = $derived.by(() => {
		if (!selectedRole) return false;
		if (selectedRole === 'other') return customRole.trim().length > 0;
		return true;
	});

	function handleOnboardingStart() {
		click_sound?.play();
		onboardingStep = 'role';
	}

	function handleRoleContinue() {
		if (!canContinueRoleStep) return;
		persistOnboardingToStorage({
			version: 1,
			role: selectedRole,
			customRole: customRole.trim(),
			name: profileName,
			description: profileDescription,
			completed: false
		});
		onboardingStep = 'profile';
	}

	function handleProfileContinue() {
		if (!selectedRole) return;
		persistOnboardingToStorage({
			version: 1,
			role: selectedRole,
			customRole: customRole.trim(),
			name: profileName,
			description: profileDescription,
			completed: true
		});
		onboardingStep = 'actions';
	}

	async function handleExitSession() {
		click_sound?.play();

		if (typeof window !== 'undefined') {
			// Clear onboarding so a new "session" can start (multiple users on same browser).
			localStorage.removeItem(ONBOARDING_KEY);

			// Clear cached discussions/messages so the next session starts fresh.
			// Keys are written as `discussion:...` in the assembly page.
			try {
				for (let i = localStorage.length - 1; i >= 0; i--) {
					const key = localStorage.key(i);
					if (!key) continue;
					if (key.startsWith('discussion:')) localStorage.removeItem(key);
				}
			} catch {
				// Ignore storage errors (quota/private mode).
			}
		}

		// Reset local state
		selectedRole = '';
		customRole = '';
		profileName = '';
		profileDescription = '';
		onboardingStep = 'welcome';

		// If the current session is anonymous, sign out so Supabase will create a new anonymous user on next load.
		// This enables multiple participants on the same browser without sharing the same user_id.
		try {
			const { data } = await supabase.auth.getSession();
			const session = data.session;
			if ((session?.user as any)?.is_anonymous) {
				await supabase.auth.signOut();
			}
		} catch {
			// Non-fatal
		}
	}

	onMount(() => {
		bootstrapOnboarding();
	});
</script>

<div
	class="flex flex-col items-center bg-[#efe7e2] bos-bg relative px-4 overflow-x-hidden"
	style="
		min-height: 100vh;
		min-height: 100svh;
		min-height: 100dvh;
		padding-top: calc(env(safe-area-inset-top) + 1rem);
		padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
	"
>
	<!-- Decorative illustrations: on mobile (vertical) show them top/bottom; on md+ keep the lateral layout -->
	<div
		class="home-ill-mobile home-ill-mobile--top md:hidden absolute inset-x-0 flex justify-between px-4 pointer-events-none z-0"
	>
		<div class="home-ill-item flex items-center justify-center">
			<img
				src={getHomeIllustrationSrc('step_5_1_home')}
				alt=""
				class="w-full h-full object-contain"
			/>
		</div>
		<div class="home-ill-item flex items-center justify-center">
			<img
				src={getHomeIllustrationSrc('step_2_1_home')}
				alt=""
				class="w-full h-full object-contain"
			/>
		</div>
	</div>
	<div
		class="home-ill-mobile home-ill-mobile--bottom md:hidden absolute inset-x-0 flex justify-between px-4 pointer-events-none z-0"
	>
		<div class="home-ill-item flex items-center justify-center">
			<img
				src={getHomeIllustrationSrc('step_6_1_home')}
				alt=""
				class="w-full h-full object-contain"
			/>
		</div>
		<div class="home-ill-item flex items-center justify-center">
			<img
				src={getHomeIllustrationSrc('step_4_1_home')}
				alt=""
				class="w-full h-full object-contain"
			/>
		</div>
	</div>

	<div
		class={`z-10 flex flex-col items-center max-w-md w-full relative flex-1 ${isActionsStep ? 'justify-start' : 'justify-center'}`}
	>
		<div class="w-full flex justify-center pb-3">
			<select
				class="p-2 border rounded bg-white/80 backdrop-blur-sm"
				bind:value={selectedLanguage}
				onchange={(e) => changeLanguage((e.currentTarget as HTMLSelectElement).value as Locale)}
			>
				{#each languages as { code, label }}
					<option value={code}>{label}</option>
				{/each}
			</select>
		</div>
		<div
			class="hidden md:flex absolute -left-56 top-0 w-32 h-32 md:w-48 md:h-48 lg:w-52 lg:h-52 items-center justify-center"
		>
			<img
				src={getHomeIllustrationSrc('step_5_1_home')}
				alt=""
				class="w-full h-full object-contain"
			/>
		</div>
		<div
			class="hidden md:flex absolute -right-56 top-0 w-32 h-32 md:w-48 md:h-48 lg:w-52 lg:h-52 items-center justify-center"
		>
			<img
				src={getHomeIllustrationSrc('step_2_1_home')}
				alt=""
				class="w-full h-full object-contain"
			/>
		</div>
		<h1
			class="bos-title flex items-center justify-center text-deep-teal font-black text-5xl md:text-7xl"
		>
			ZoopDAO
		</h1>
		<p class="text-deep-teal text-center text-lg mb-5 px-4 italic">{m.home_tagline()}</p>
		<!-- Containerized start flow (Typeform-style) -->
		<div
			class={`w-full flex flex-col items-stretch justify-center rounded-xl border-2 bg-white/70 backdrop-blur-sm ${
				isActionsStep ? 'gap-4 mt-2 p-4' : 'gap-5 mt-4 p-5'
			}`}
		>
			{#if onboardingStep === 'welcome'}
				<div class="flex flex-col gap-2 text-center">
					<p class="text-deep-teal font-bold text-xl">
						{getLocale() === 'pt' ? 'Bem vindo' : 'Welcome'}
					</p>
					<p class="text-deep-teal/80 text-sm">
						{getLocale() === 'pt'
							? 'Clique no botão Iniciar para entrar na assembleia.'
							: 'Click the start button to enter the assembly.'}
					</p>
				</div>
				<Button size="lg" onclick={handleOnboardingStart} class="w-full">
					{getLocale() === 'pt' ? 'Iniciar' : 'Start'}
				</Button>
			{:else if onboardingStep === 'role'}
				<div class="flex flex-col gap-3">
					<p class="text-deep-teal font-bold text-lg">{m.select_role()}</p>
					<Select.Root
						type="single"
						value={selectedRole}
						onValueChange={(v) => {
							selectedRole = v as Role | 'other';
							if (selectedRole !== 'other') customRole = '';
						}}
						items={roleOptions}
					>
						<Select.Trigger
							class="h-10 rounded-md border-gray-300 bg-white focus:ring-deep-teal focus:border-deep-teal focus:ring-1 outline-none inline-flex w-full select-none items-center border px-3 text-sm transition-colors"
							aria-label="Select a role"
						>
							<span class={selectedRole ? 'text-black' : 'text-gray-400'}>{selectedRoleLabel}</span>
							<ChevronsUpDown class="text-gray-300 ml-auto size-6" />
						</Select.Trigger>
						<Select.Portal>
							<Select.Content
								class="focus-override border-deep-teal bg-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 outline-hidden z-50 max-h-[var(--bits-select-content-available-height)] w-[var(--bits-select-anchor-width)] min-w-[var(--bits-select-anchor-width)] select-none rounded-xl border px-1 py-2 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
								sideOffset={10}
							>
								<Select.ScrollUpButton class="flex w-full items-center justify-center">
									<ChevronUp class="size-3" />
								</Select.ScrollUpButton>
								<Select.Viewport class="p-1">
									{#each roleOptions as option (option.value)}
										<Select.Item
											class="flex h-10 w-full cursor-pointer select-none items-center rounded-md px-3 text-sm outline-none transition-colors data-[highlighted]:bg-gray-100 data-[selected]:bg-deep-teal data-[selected]:text-white"
											value={option.value}
											label={option.label}
										>
											{#snippet children({ selected })}
												<span class="flex-1">{option.label}</span>
												{#if selected}
													<div class="ml-2">
														<Check aria-label="check" />
													</div>
												{/if}
											{/snippet}
										</Select.Item>
									{/each}
								</Select.Viewport>
								<Select.ScrollDownButton class="flex w-full items-center justify-center">
									<ChevronDown class="size-3" />
								</Select.ScrollDownButton>
							</Select.Content>
						</Select.Portal>
					</Select.Root>
					{#if selectedRole === 'other'}
						<label class="text-sm text-deep-teal/80">
							{getLocale() === 'pt' ? 'Especifica (obrigatorio)' : 'Specify (required)'}
						</label>
						<input
							class="p-3 border-2 border-deep-teal/20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-deep-teal/30"
							bind:value={customRole}
							placeholder={getLocale() === 'pt' ? 'Escreve o teu cargo...' : 'Type your role...'}
						/>
					{/if}
					<Button
						size="lg"
						onclick={handleRoleContinue}
						disabled={!canContinueRoleStep}
						class="w-full"
					>
						{m.continue()}
					</Button>
				</div>
			{:else if onboardingStep === 'profile'}
				<div class="flex flex-col gap-3">
					<p class="text-deep-teal font-bold text-lg">
						{getLocale() === 'pt' ? 'Opcional' : 'Optional'}
					</p>
					<label class="text-sm text-deep-teal/80">
						{m.nickname()} ({getLocale() === 'pt' ? 'opcional' : 'optional'})
					</label>
					<input
						class="p-3 border-2 border-deep-teal/20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-deep-teal/30"
						bind:value={profileName}
						placeholder={getLocale() === 'pt' ? 'O teu nome...' : 'Your name...'}
					/>
					<label class="text-sm text-deep-teal/80">
						{m.description()} ({getLocale() === 'pt' ? 'opcional' : 'optional'})
					</label>
					<textarea
						class="p-3 border-2 border-deep-teal/20 rounded-lg bg-white min-h-24 resize-none focus:outline-none focus:ring-2 focus:ring-deep-teal/30"
						bind:value={profileDescription}
						placeholder={m.role_description_placeholder()}
					/>
					<Button size="lg" onclick={handleProfileContinue} class="w-full">
						{m.continue()}
					</Button>
				</div>
			{:else}
				<!-- Current main actions (containerized) -->
				<div class="flex flex-col items-center justify-center">
					<Button size="lg" href={localizeUrl('/proposals/new').toString()} class="w-full">
						{m.new_proposal()}
					</Button>
				</div>
				<div class="flex items-center gap-4 w-full">
					<div class="h-px w-full bg-deep-teal"></div>
					<p
						class="text-deep-teal text-center font-bold whitespace-nowrap text-[clamp(1rem,3.2vw,1.125rem)]"
					>
						{m.current_proposals()}
					</p>
					<div class="h-px w-full bg-deep-teal"></div>
				</div>
				<!-- Proposals List -->
				<div class="w-full flex flex-col items-center justify-center gap-2">
					{#if proposals.length === 0}
						<p class="text-gray-500 text-sm italic">{m.no_proposals()}</p>
					{:else}
						<div class="w-full space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
							{#each proposals as proposal}
								{@const translatedProposal = translateProposal(proposal, currentLocale)}
								{@const status = getProposalStatus(proposal.voting_period_id, votingPeriods)}
								{@const StatusIcon = getProposalStatusIcon(status)}
								<button
									onclick={() => handleProposalClick(proposal.id)}
									class="w-full p-3 bg-white border-2 border-deep-teal border-opacity-20 rounded-lg hover:border-deep-teal hover:border-opacity-60 hover:bg-gray-50 transition-all text-left"
								>
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1 flex flex-col gap-1">
											<p class="font-semibold text-deep-teal">{translatedProposal.title}</p>
											<p class="text-xs text-gray-500">
												{m.voting_period()}: {getVotingPeriodLabel(proposal.voting_period_id)}
											</p>
										</div>
										<div class="flex items-center gap-1" title={getProposalStatusText(status)}>
											<StatusIcon class={`h-5 w-5 ${getProposalStatusColor(status)}`} />
											<span class={`text-xs ${getProposalStatusColor(status)}`}>
												{getProposalStatusText(status)}
											</span>
										</div>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<div class="h-px w-full bg-deep-teal"></div>
				<div class="flex flex-col items-center justify-center">
					<Button
						variant="outline"
						size="lg"
						onclick={handleBrowseDiscussions}
						class="w-full text-deep-teal hover:opacity-90 bg-white hover-bg-gray-200 transition-all duration-200 ease-in-out border-deep-teal border-opacity-20 hover:border-deep-teal hover:border-opacity-90"
					>
						{m.browse_stories()}
					</Button>
				</div>

				<!-- Move role + edit to the bottom (below Browse discussions) -->
				<div class="flex items-center justify-between gap-3 pt-2">
					<div class="flex flex-col">
						<p class="text-deep-teal font-bold text-base">
							{getLocale() === 'pt' ? 'Cargo' : 'Role'}:{' '}
							{selectedRole === 'other'
								? customRole.trim() || '-'
								: selectedRole
									? getRoleLabel(selectedRole as Role)
									: '-'}
						</p>
						{#if profileName.trim()}
							<p class="text-deep-teal/70 text-sm">
								{getLocale() === 'pt' ? 'Nome' : 'Name'}: {profileName}
							</p>
						{/if}
					</div>
					<Button variant="outline" size="sm" onclick={handleExitSession}>
						{getLocale() === 'pt' ? 'Sair' : 'Exit'}
					</Button>
				</div>
			{/if}
		</div>
		<div
			class="hidden md:flex absolute -right-56 bottom-0 w-32 h-32 md:w-48 md:h-48 lg:w-52 lg:h-52 items-center justify-center"
		>
			<img
				src={getHomeIllustrationSrc('step_4_1_home')}
				alt=""
				class="w-full h-full object-contain"
			/>
		</div>
		<div
			class="hidden md:flex absolute -left-56 bottom-0 w-32 h-32 md:w-48 md:h-48 lg:w-52 lg:h-52 items-center justify-center"
		>
			<img
				src={getHomeIllustrationSrc('step_6_1_home')}
				alt=""
				class="w-full h-full object-contain"
			/>
		</div>
	</div>
</div>

<style>
	/* Smoothly adapt decorative illustration positions/sizes between portrait and landscape on mobile. */
	.home-ill-mobile {
		--home-ill-size: clamp(56px, 14vmin, 88px);
	}

	.home-ill-item {
		width: var(--home-ill-size);
		height: var(--home-ill-size);
	}

	.home-ill-mobile--top {
		top: 1rem;
	}

	.home-ill-mobile--bottom {
		bottom: 1rem; /* 16px */
	}

	/* Keep the top illustrations away from the title text. */
	.home-ill-mobile--top .home-ill-item:first-child {
		transform: translate(-12px, -10px);
	}

	.home-ill-mobile--top .home-ill-item:last-child {
		transform: translate(12px, -10px);
	}

	@media (max-width: 767px) and (orientation: portrait) {
		.home-ill-mobile {
			/* In portrait we can go a bit larger while staying proportional. */
			--home-ill-size: clamp(64px, 16vmin, 100px);
		}

		.home-ill-mobile--top {
			top: 1.25rem;
		}
	}

	@media (max-width: 767px) and (orientation: landscape) {
		/* In landscape tighten the vertical spacing (top/bottom closer) and keep size stable. */
		.home-ill-mobile--top {
			top: 0.75rem;
		}
		.home-ill-mobile--bottom {
			bottom: 0.75rem;
		}
	}
</style>
