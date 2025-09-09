/**
 * Standalone usage example for @vscode/prompt-tsx
 *
 * This example shows how to use the library without VS Code dependencies.
 */

import {
	renderPrompt,
	SimpleTokenizer,
	LanguageModelChatMessageRole,
	type LanguageModelChatMessage,
	AssistantMessage,
	SystemMessage,
	UserMessage,
	PromptElement,
	BasePromptElementProps,
	OutputMode,
} from '../src/base';

// Simple example prompt
class ExamplePrompt extends PromptElement<{ query: string } & BasePromptElementProps> {
	render() {
		return (
			<>
				<SystemMessage priority={100}>
					You are a helpful AI assistant. Answer questions clearly and concisely.
				</SystemMessage>
				<UserMessage priority={90}>{this.props.query}</UserMessage>
			</>
		);
	}
}

// Example usage
async function example() {
	// Create a simple tokenizer (you can also integrate with your own tokenizer)
	const tokenizer = new SimpleTokenizer();

	// Define the endpoint configuration
	const endpoint = {
		modelMaxPromptTokens: 4096,
	};

	try {
		// Render the prompt
		const result = await renderPrompt(
			ExamplePrompt,
			{ query: 'What is TypeScript and why should I use it?' },
			endpoint,
			tokenizer
		);

		console.log('Rendered messages:');
		result.messages.forEach((message: LanguageModelChatMessage, index: number) => {
			const roleNames = {
				[LanguageModelChatMessageRole.User]: 'User',
				[LanguageModelChatMessageRole.Assistant]: 'Assistant',
				[LanguageModelChatMessageRole.System]: 'System',
			};

			console.log(`${index + 1}. ${roleNames[message.role]}: ${message.content}`);
		});

		console.log(`\nTotal tokens: ${result.tokenCount}`);

		// You can now use result.messages with any LLM API (OpenAI, Anthropic, etc.)
		return result;
	} catch (error) {
		console.error('Error rendering prompt:', error);
		throw error;
	}
}

// Example with file contents (using the file-contents example)
import { MyPrompt } from './standalone-file-contents';

async function exampleWithFiles() {
	const tokenizer = new SimpleTokenizer();
	const endpoint = { modelMaxPromptTokens: 8192 };

	const files = [
		{
			filename: 'example.ts',
			content: `
function greet(name: string): string {
    return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);
			`.trim(),
			focusLine: 1,
		},
		{
			filename: 'package.json',
			content: `
{
  "name": "example",
  "version": "1.0.0",
  "dependencies": {
    "typescript": "^5.0.0"
  }
}
			`.trim(),
		},
	];

	const result = await renderPrompt(
		MyPrompt,
		{
			userQuery: 'Explain what this TypeScript code does and how it works.',
			files: files,
		},
		endpoint,
		tokenizer
	);

	console.log('\n=== File Contents Example ===');
	result.messages.forEach((message: LanguageModelChatMessage, index: number) => {
		console.log(
			`${index + 1}. ${message.role === LanguageModelChatMessageRole.System ? 'System' : 'User'}:`
		);
		console.log(message.content);
		console.log('---');
	});

	return result;
}

// Run examples if this file is executed directly
if (require.main === module) {
	Promise.all([example(), exampleWithFiles()])
		.then(() => {
			console.log('\n✅ All examples completed successfully!');
		})
		.catch(error => {
			console.error('❌ Example failed:', error);
			process.exit(1);
		});
}

export { example, exampleWithFiles };
