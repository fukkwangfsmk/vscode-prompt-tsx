import type { LanguageModelChatMessage } from '../standalone-types';
import { LanguageModelChatMessageRole } from '../standalone-types';
import * as Raw from './rawTypes';

function onlyStringContent(content: Raw.ChatCompletionContentPart[]): string {
	return content
		.filter(part => part.type === Raw.ChatCompletionContentPartKind.Text)
		.map(part => (part as Raw.ChatCompletionContentPartText).text)
		.join('');
}

export function toStandaloneChatMessage(m: Raw.ChatMessage): LanguageModelChatMessage | undefined {
	switch (m.role) {
		case Raw.ChatRole.Assistant:
			return {
				role: LanguageModelChatMessageRole.Assistant,
				content: onlyStringContent(m.content),
				name: m.name,
			};
		case Raw.ChatRole.User:
			return {
				role: LanguageModelChatMessageRole.User,
				content: onlyStringContent(m.content),
				name: m.name,
			};
		case Raw.ChatRole.System:
			return {
				role: LanguageModelChatMessageRole.System,
				content: onlyStringContent(m.content),
				name: m.name,
			};
		case Raw.ChatRole.Tool:
			// Tool messages are converted to user messages with special formatting
			return {
				role: LanguageModelChatMessageRole.User,
				content: `Tool result: ${onlyStringContent(m.content)}`,
				name: m.name,
			};
		default:
			return undefined;
	}
}

/**
 * Converts an array of {@link ChatMessage} objects to an array of corresponding {@link LanguageModelChatMessage standalone chat messages}.
 * @param messages - The array of {@link ChatMessage} objects to convert.
 * @returns An array of {@link LanguageModelChatMessage standalone chat messages}.
 */
export function toStandaloneChatMessages(
	messages: readonly Raw.ChatMessage[]
): LanguageModelChatMessage[] {
	return messages.map(toStandaloneChatMessage).filter(r => !!r) as LanguageModelChatMessage[];
}

// Keep the original vscode functions for backward compatibility
export function toVsCodeChatMessage(m: Raw.ChatMessage): any | undefined {
	// This function will only work in VS Code environment
	if (typeof require === 'undefined' || !globalThis.require) {
		throw new Error(
			'VS Code functions can only be used in VS Code environment. Use toStandaloneChatMessage instead.'
		);
	}

	let vscode: any;
	try {
		vscode = require('vscode');
	} catch (err) {
		throw new Error(
			'VS Code functions can only be used in VS Code environment. Use toStandaloneChatMessage instead.'
		);
	}

	switch (m.role) {
		case Raw.ChatRole.Assistant:
			const message: any = vscode.LanguageModelChatMessage.Assistant(
				onlyStringContent(m.content),
				m.name
			);
			if (m.toolCalls) {
				message.content = [
					new vscode.LanguageModelTextPart(onlyStringContent(m.content)),
					...m.toolCalls.map((tc: any) => {
						let parsedArgs: object;
						try {
							parsedArgs = JSON.parse(tc.function.arguments);
						} catch (err) {
							throw new Error('Invalid JSON in tool call arguments for tool call: ' + tc.id);
						}

						return new vscode.LanguageModelToolCallPart(tc.id, tc.function.name, parsedArgs);
					}),
				];
			}
			return message;
		case Raw.ChatRole.User:
			return vscode.LanguageModelChatMessage.User(onlyStringContent(m.content), m.name);
		case Raw.ChatRole.Tool: {
			const message: any = vscode.LanguageModelChatMessage.User('');
			message.content = [
				new vscode.LanguageModelToolResultPart(m.toolCallId, [
					new vscode.LanguageModelTextPart(onlyStringContent(m.content)),
				]),
			];
			return message;
		}
		default:
			return undefined;
	}
}

/**
 * Converts an array of {@link ChatMessage} objects to an array of corresponding {@link LanguageModelChatMessage VS Code chat messages}.
 * @param messages - The array of {@link ChatMessage} objects to convert.
 * @returns An array of {@link LanguageModelChatMessage VS Code chat messages}.
 */
export function toVsCodeChatMessages(messages: readonly Raw.ChatMessage[]): any[] {
	return messages.map(toVsCodeChatMessage).filter(r => !!r);
}
