/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation and GitHub. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import type {
	CancellationToken,
	LanguageModelChat,
	LanguageModelChatMessage,
} from '../standalone-types';
import { ModeToChatMessageType, OutputMode, Raw } from '../output/mode';

/**
 * Represents a tokenizer that can be used to tokenize text in chat messages.
 */
export interface ITokenizer<M extends OutputMode = OutputMode> {
	/**
	 * This mode this tokenizer operates on.
	 */
	readonly mode: M;

	/**
	 * Return the length of `part` in number of tokens. If the model does not
	 * support the given kind of part, it may return 0.
	 *
	 * @param {str} text - The input text
	 * @returns {number}
	 */
	tokenLength(
		part: Raw.ChatCompletionContentPart,
		token?: CancellationToken
	): Promise<number> | number;

	/**
	 * Returns the token length of the given message.
	 */
	countMessageTokens(message: ModeToChatMessageType[M]): Promise<number> | number;
}

export class StandaloneTokenizer implements ITokenizer<OutputMode.VSCode> {
	public readonly mode = OutputMode.VSCode;

	constructor(
		private countTokens: (
			text: string | LanguageModelChatMessage,
			token?: CancellationToken
		) => Thenable<number>,
		mode: OutputMode
	) {
		if (mode !== OutputMode.VSCode) {
			throw new Error('`mode` must be set to vscode when using LanguageModelChat as the tokenizer');
		}
	}

	async tokenLength(
		part: Raw.ChatCompletionContentPart,
		token?: CancellationToken
	): Promise<number> {
		if (part.type === Raw.ChatCompletionContentPartKind.Text) {
			return this.countTokens(part.text, token);
		}

		return Promise.resolve(0);
	}

	async countMessageTokens(message: LanguageModelChatMessage): Promise<number> {
		return this.countTokens(message);
	}
}

/**
 * A simple tokenizer that estimates token count based on words and characters
 * This is a fallback when no proper tokenizer is available
 */
export class SimpleTokenizer implements ITokenizer<OutputMode.VSCode> {
	public readonly mode = OutputMode.VSCode;

	tokenLength(part: Raw.ChatCompletionContentPart): number {
		if (part.type === Raw.ChatCompletionContentPartKind.Text) {
			return this.estimateTokenCount(part.text);
		}
		return 0;
	}

	countMessageTokens(message: LanguageModelChatMessage): number {
		return this.estimateTokenCount(message.content);
	}

	private estimateTokenCount(text: string): number {
		// Simple estimation: ~4 characters per token on average for English text
		// This is a rough approximation, real tokenizers are much more sophisticated
		if (!text) return 0;

		// Count words and add some overhead for special tokens
		const words = text.trim().split(/\s+/).length;
		const chars = text.length;

		// Use a hybrid approach: base on words but account for longer words
		return Math.max(words, Math.ceil(chars / 4));
	}
}

// Re-export the original VSCodeTokenizer for backward compatibility when using with actual VS Code
export class VSCodeTokenizer implements ITokenizer<OutputMode.VSCode> {
	public readonly mode = OutputMode.VSCode;

	constructor(
		private countTokens: (
			text: string | LanguageModelChatMessage,
			token?: CancellationToken
		) => Thenable<number>,
		mode: OutputMode
	) {
		if (mode !== OutputMode.VSCode) {
			throw new Error(
				'`mode` must be set to vscode when using vscode.LanguageModelChat as the tokenizer'
			);
		}
	}

	async tokenLength(
		part: Raw.ChatCompletionContentPart,
		token?: CancellationToken
	): Promise<number> {
		if (part.type === Raw.ChatCompletionContentPartKind.Text) {
			return this.countTokens(part.text, token);
		}

		return Promise.resolve(0);
	}

	async countMessageTokens(message: LanguageModelChatMessage): Promise<number> {
		return this.countTokens(message);
	}
}
