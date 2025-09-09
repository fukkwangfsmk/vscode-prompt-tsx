/**
 * Unit tests for standalone prompt-tsx library
 */

import * as assert from 'assert';
import {
	renderPrompt,
	SimpleTokenizer,
	StandaloneTokenizer,
	LanguageModelChatMessageRole,
	type LanguageModelChatMessage,
	SystemMessage,
	UserMessage,
	AssistantMessage,
	PromptElement,
	BasePromptElementProps,
	OutputMode,
} from '../index';

// Simple test prompt class
class TestPrompt extends PromptElement<{ message: string } & BasePromptElementProps> {
	render() {
		return (
			<>
				<SystemMessage priority={100}>You are a test assistant.</SystemMessage>
				<UserMessage priority={90}>{this.props.message}</UserMessage>
			</>
		);
	}
}

// Complex test prompt with multiple messages
class ComplexPrompt extends PromptElement<
	{ query: string; context: string } & BasePromptElementProps
> {
	render() {
		return (
			<>
				<SystemMessage priority={100}>
					You are a helpful AI assistant. Use the provided context to answer questions.
				</SystemMessage>
				<UserMessage priority={80}>Context: {this.props.context}</UserMessage>
				<UserMessage priority={90}>Question: {this.props.query}</UserMessage>
			</>
		);
	}
}

suite('Standalone Prompt TSX Library', () => {
	suite('SimpleTokenizer', () => {
		test('should estimate token count for text', () => {
			const tokenizer = new SimpleTokenizer();

			// Test basic text
			const shortText = 'Hello world';
			const count = tokenizer.tokenLength({ type: 1, text: shortText }); // Raw.ChatCompletionContentPartKind.Text = 1
			assert.ok(typeof count === 'number');
			assert.ok(count > 0);

			// Longer text should have more tokens
			const longText =
				'This is a much longer piece of text that should definitely have more tokens than the shorter one.';
			const longCount = tokenizer.tokenLength({ type: 1, text: longText });
			assert.ok(longCount > count);
		});

		test('should count message tokens', () => {
			const tokenizer = new SimpleTokenizer();
			const message: LanguageModelChatMessage = {
				role: LanguageModelChatMessageRole.User,
				content: 'Test message for token counting',
			};

			const count = tokenizer.countMessageTokens(message);
			assert.ok(typeof count === 'number');
			assert.ok(count > 0);
		});
	});

	suite('StandaloneTokenizer', () => {
		test('should work with custom count function', async () => {
			const customCountTokens = async (text: string | LanguageModelChatMessage) => {
				// Simple mock: 1 token per word
				if (typeof text === 'string') {
					return text.split(/\s+/).length;
				} else {
					return text.content.split(/\s+/).length;
				}
			};

			const tokenizer = new StandaloneTokenizer(customCountTokens, OutputMode.VSCode);

			const count = await tokenizer.tokenLength({ type: 1, text: 'hello world test' });
			assert.strictEqual(count, 3); // 3 words = 3 tokens
		});
	});

	suite('renderPrompt', () => {
		test('should render a simple prompt', async () => {
			const tokenizer = new SimpleTokenizer();
			const endpoint = { modelMaxPromptTokens: 1000 };

			const result = await renderPrompt(
				TestPrompt,
				{ message: 'Hello, test world!' },
				endpoint,
				tokenizer
			);

			assert.ok(Array.isArray(result.messages));
			assert.strictEqual(result.messages.length, 2);

			// Check system message
			const systemMsg = result.messages[0];
			assert.strictEqual(systemMsg.role, LanguageModelChatMessageRole.System);
			assert.ok(systemMsg.content.includes('test assistant'));

			// Check user message
			const userMsg = result.messages[1];
			assert.strictEqual(userMsg.role, LanguageModelChatMessageRole.User);
			assert.ok(userMsg.content.includes('Hello, test world!'));

			// Check token count
			assert.ok(typeof result.tokenCount === 'number');
			assert.ok(result.tokenCount > 0);
		});

		test('should render a complex prompt with multiple messages', async () => {
			const tokenizer = new SimpleTokenizer();
			const endpoint = { modelMaxPromptTokens: 2000 };

			const result = await renderPrompt(
				ComplexPrompt,
				{
					query: 'What is TypeScript?',
					context: 'TypeScript is a programming language developed by Microsoft.',
				},
				endpoint,
				tokenizer
			);

			assert.strictEqual(result.messages.length, 3);

			// Messages should be ordered by priority
			const [systemMsg, contextMsg, queryMsg] = result.messages;

			assert.strictEqual(systemMsg.role, LanguageModelChatMessageRole.System);
			assert.strictEqual(contextMsg.role, LanguageModelChatMessageRole.User);
			assert.strictEqual(queryMsg.role, LanguageModelChatMessageRole.User);

			assert.ok(contextMsg.content.includes('TypeScript is a programming language'));
			assert.ok(queryMsg.content.includes('What is TypeScript?'));
		});

		test('should respect token budget and prioritization', async () => {
			const tokenizer = new SimpleTokenizer();
			const endpoint = { modelMaxPromptTokens: 50 }; // Very small budget

			const result = await renderPrompt(
				ComplexPrompt,
				{
					query:
						'This is a very long question that might get truncated if the budget is too small for all messages',
					context:
						'This is also a very long context that should definitely be truncated or removed entirely if the token budget is too restrictive',
				},
				endpoint,
				tokenizer
			);

			// Should still have messages, but may be truncated
			assert.ok(result.messages.length >= 1);
			assert.ok(result.tokenCount <= endpoint.modelMaxPromptTokens);

			// System message should survive due to highest priority
			const systemMsg = result.messages.find(m => m.role === LanguageModelChatMessageRole.System);
			assert.ok(systemMsg !== undefined);
		});

		test('should handle empty content gracefully', async () => {
			const tokenizer = new SimpleTokenizer();
			const endpoint = { modelMaxPromptTokens: 1000 };

			const result = await renderPrompt(TestPrompt, { message: '' }, endpoint, tokenizer);

			assert.ok(result.messages.length >= 1);
			assert.ok(typeof result.tokenCount === 'number');
		});
	});

	suite('Message Types', () => {
		test('should support all message roles', () => {
			const roles = [
				LanguageModelChatMessageRole.System,
				LanguageModelChatMessageRole.User,
				LanguageModelChatMessageRole.Assistant,
			];

			roles.forEach(role => {
				assert.ok(typeof role === 'number');
			});
		});
	});

	suite('Integration Test', () => {
		test('should work end-to-end with a realistic prompt', async () => {
			class RealisticPrompt extends PromptElement<
				{
					systemInstructions: string;
					userQuery: string;
					context?: string;
				} & BasePromptElementProps
			> {
				render() {
					return (
						<>
							<SystemMessage priority={100}>{this.props.systemInstructions}</SystemMessage>
							{this.props.context && (
								<UserMessage priority={70}>Additional context: {this.props.context}</UserMessage>
							)}
							<UserMessage priority={90}>{this.props.userQuery}</UserMessage>
						</>
					);
				}
			}

			const tokenizer = new SimpleTokenizer();
			const endpoint = { modelMaxPromptTokens: 4096 };

			const result = await renderPrompt(
				RealisticPrompt,
				{
					systemInstructions:
						'You are an expert TypeScript developer. Help users with coding questions.',
					userQuery: 'How do I create a generic function in TypeScript?',
					context:
						'The user is working on a React application and wants to create reusable utility functions.',
				},
				endpoint,
				tokenizer
			);

			// Verify structure
			assert.ok(result.messages.length >= 2);
			assert.ok(result.tokenCount > 0);
			assert.ok(result.tokenCount <= endpoint.modelMaxPromptTokens);

			// Verify content
			const systemMsg = result.messages.find(m => m.role === LanguageModelChatMessageRole.System);
			assert.ok(systemMsg);
			assert.ok(systemMsg.content.includes('TypeScript developer'));

			const userMsgs = result.messages.filter(m => m.role === LanguageModelChatMessageRole.User);
			assert.ok(userMsgs.length >= 1);

			const hasQuery = userMsgs.some(msg => msg.content.includes('generic function'));
			assert.ok(hasQuery, 'User query should be present in messages');
		});
	});
});
