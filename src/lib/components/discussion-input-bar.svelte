<script lang="ts">
	import { FileText, MessageSquare, Send } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';
	import { supabase } from '@/supabase';

	interface DiscussionInputBarProps {
		onSend: (message: string) => void;
		onOpenHistory: () => void;
		gameId: number;
		proposalId: number | null;
		round: number;
		userId?: string | null;
		disabled?: boolean;
	}

	let {
		onSend,
		onOpenHistory,
		gameId,
		proposalId,
		round,
		userId = null,
		disabled = false
	}: DiscussionInputBarProps = $props();

	let message = $state('');
	let attachments = $state<
		{ id: string; name: string; size: number | null; status: 'uploading' | 'uploaded' | 'error' }[]
	>([]);
	let uploadError = $state<string | null>(null);
	let fileInput: HTMLInputElement | null = null;

	const DOCUMENTS_BUCKET = 'discussion-documents';

	function buildStoragePath() {
		const proposalKey = proposalId ? `proposal-${proposalId}` : `game-${gameId}`;
		return `${proposalKey}/round-${round}`;
	}

	function sanitizeFilename(name: string) {
		return name.replace(/[^a-zA-Z0-9._-]/g, '_');
	}

	function formatFileSize(size: number | null) {
		if (!size) return '';
		if (size < 1024) return `${size} B`;
		const kb = size / 1024;
		if (kb < 1024) return `${kb.toFixed(1)} KB`;
		const mb = kb / 1024;
		return `${mb.toFixed(1)} MB`;
	}

	async function refreshAttachments() {
		if (!proposalId || round !== 7) {
			attachments = [];
			return;
		}

		const path = buildStoragePath();
		const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).list(path, {
			limit: 100,
			sortBy: { column: 'created_at', order: 'desc' }
		});

		if (error) {
			uploadError = error.message;
			return;
		}

		attachments =
			data?.map((item) => ({
				id: item.id ?? `${path}/${item.name}`,
				name: item.name,
				size: (item.metadata as { size?: number } | null)?.size ?? null,
				status: 'uploaded'
			})) ?? [];
	}

	async function uploadFiles(files: File[]) {
		if (!proposalId || round !== 7) return;
		uploadError = null;

		const path = buildStoragePath();
		for (const file of files) {
			const attachmentId = `${Date.now()}-${file.name}`;
			attachments = [
				{ id: attachmentId, name: file.name, size: file.size, status: 'uploading' },
				...attachments
			];

			const storagePath = `${path}/${attachmentId}-${sanitizeFilename(file.name)}`;
			const { error } = await supabase.storage
				.from(DOCUMENTS_BUCKET)
				.upload(storagePath, file, { upsert: false });

			if (error) {
				attachments = attachments.map((attachment) =>
					attachment.id === attachmentId
						? { ...attachment, status: 'error' }
						: attachment
				);
				uploadError = error.message;
			} else {
				attachments = attachments.map((attachment) =>
					attachment.id === attachmentId
						? { ...attachment, status: 'uploaded' }
						: attachment
				);

				const ingestResponse = await fetch('/api/documents/ingest', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						proposalId,
						round,
						userId,
						files: [
							{
								storagePath,
								filename: file.name,
								mimeType: file.type,
								sizeBytes: file.size
							}
						]
					})
				});

				if (!ingestResponse.ok) {
					uploadError = m.upload_failed();
				}
			}
		}

		await refreshAttachments();
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (!files.length) return;
		void uploadFiles(files);
		input.value = '';
	}

	$effect(() => {
		if (!proposalId || round !== 7) {
			attachments = [];
			return;
		}
		void refreshAttachments();
	});

	function handleSend() {
		if (message.trim() && !disabled) {
			onSend(message.trim());
			message = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}
</script>

<!-- Discussion Input Bar -->
<div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[760px] z-50 pointer-events-auto">
	<div class="relative">
		{#if attachments.length > 0 || uploadError}
			<div class="mb-2 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-xs text-white shadow-lg">
				<div class="flex items-center justify-between">
					<span class="font-semibold">{m.attachments()}</span>
					{#if uploadError}
						<span class="text-red-300">{m.upload_failed()}</span>
					{/if}
				</div>
				{#if attachments.length > 0}
					<ul class="mt-2 space-y-1">
						{#each attachments as attachment}
							<li class="flex items-center justify-between gap-2">
								<span class="truncate">{attachment.name}</span>
								<span class="flex-shrink-0 text-[11px] text-white/70">
									{#if attachment.status === 'uploading'}
										{m.uploading()}
									{:else if attachment.status === 'error'}
										{m.upload_failed()}
									{:else}
										{formatFileSize(attachment.size)}
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
		<!-- Background bar with shadow -->
		<div class="bg-gradient-to-b from-[#3a3a3a] to-[#2f2f2f] rounded-full px-4 py-3 sm:px-5 sm:py-4 shadow-2xl border border-white/10">
			<div class="flex items-center gap-3 sm:gap-4">
				<!-- History Button -->
				<button
					onclick={onOpenHistory}
					disabled={disabled}
					class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3f3f3f] hover:bg-[#4a4a4a] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label={m.open_message_history()}
					title={m.open_message_history()}
				>
					<MessageSquare class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
				</button>

				<!-- Divider -->
				<div class="h-8 sm:h-10 w-px bg-white/10"></div>

				<!-- Add Documents Button -->
				<input
					bind:this={fileInput}
					type="file"
					class="hidden"
					multiple
					onchange={handleFileSelect}
					disabled={disabled}
				/>
				<button
					type="button"
					onclick={() => fileInput?.click()}
					disabled={disabled || !proposalId}
					class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3f3f3f] hover:bg-[#4a4a4a] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label={m.add_documents()}
					title={m.add_documents()}
				>
					<FileText class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
				</button>

				<!-- Divider -->
				<div class="h-8 sm:h-10 w-px bg-white/10"></div>

				<!-- Input Field -->
				<input
					type="text"
					bind:value={message}
					onkeydown={handleKeydown}
					disabled={disabled}
					placeholder={m.discussion_input_placeholder()}
					class="flex-1 bg-transparent text-white text-base sm:text-lg placeholder:text-[#d8d8d8]/65 outline-none disabled:opacity-50"
				/>

				<!-- Send Button -->
				<button
					onclick={handleSend}
					disabled={disabled || !message.trim()}
					class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
					aria-label={m.send_message()}
					title={m.send_message()}
				>
					<Send class="w-5 h-5 sm:w-6 sm:h-6 text-[#1f1f1f]" />
				</button>
			</div>
		</div>
	</div>
</div>
