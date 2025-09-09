# @vscode/prompt-tsx - Standalone Usage

This is the **standalone version** of @vscode/prompt-tsx that can be used without VS Code dependencies. This library allows you to build structured prompts using TSX syntax and render them to language model chat messages.

## Installation

```bash
npm install @vscode/prompt-tsx
```

## Basic Usage

```typescript
import {
	renderPrompt,
	SimpleTokenizer,
	SystemMessage,
	UserMessage,
	PromptElement,
	BasePromptElementProps,
} from '@vscode/prompt-tsx';

// Define a prompt component
class MyPrompt extends PromptElement<{ query: string } & BasePromptElementProps> {
	render() {
		return (
			<>
				<SystemMessage priority={100}>You are a helpful AI assistant.</SystemMessage>
				<UserMessage priority={90}>{this.props.query}</UserMessage>
			</>
		);
	}
}

// Render the prompt
async function main() {
	const tokenizer = new SimpleTokenizer();
	const endpoint = { modelMaxPromptTokens: 4000 };

	const result = await renderPrompt(
		MyPrompt,
		{ query: 'What is TypeScript?' },
		endpoint,
		tokenizer
	);

	console.log('Messages:', result.messages);
	console.log('Token count:', result.tokenCount);
}
```

## Features

### 1. Simple Token Counting

The `SimpleTokenizer` provides basic word-based token estimation:

```typescript
import { SimpleTokenizer } from '@vscode/prompt-tsx';

const tokenizer = new SimpleTokenizer();
const count = await tokenizer.countTokens('Hello world'); // Basic token counting
```

### 2. Custom Token Counting

Use `StandaloneTokenizer` with your own token counting logic:

```typescript
import { StandaloneTokenizer } from '@vscode/prompt-tsx';

const customTokenizer = new StandaloneTokenizer(async text => {
	// Your custom token counting logic here
	return text.split(' ').length;
});
```

### 3. Message Prioritization

Control which content gets included when you hit token limits:

```typescript
class PrioritizedPrompt extends PromptElement<BasePromptElementProps> {
	render() {
		return (
			<>
				<SystemMessage priority={100}>Critical system instructions</SystemMessage>
				<UserMessage priority={80}>Important user question</UserMessage>
				<UserMessage priority={20}>Less important context</UserMessage>
				<UserMessage priority={10}>Optional background info</UserMessage>
			</>
		);
	}
}

// With limited token budget, lower priority messages get pruned
const result = await renderPrompt(
	PrioritizedPrompt,
	{},
	{ modelMaxPromptTokens: 100 }, // Small budget
	tokenizer
);
```

### 4. Multiple Message Types

```typescript
import {
	SystemMessage,
	UserMessage,
	AssistantMessage,
	LanguageModelChatMessageRole,
} from '@vscode/prompt-tsx';

class ConversationPrompt extends PromptElement<BasePromptElementProps> {
	render() {
		return (
			<>
				<SystemMessage>You are a helpful assistant.</SystemMessage>
				<UserMessage>Hello!</UserMessage>
				<AssistantMessage>Hi there! How can I help you?</AssistantMessage>
				<UserMessage>What's the weather like?</UserMessage>
			</>
		);
	}
}
```

## TypeScript Configuration

Make sure your `tsconfig.json` is configured for JSX:

```json
{
	"compilerOptions": {
		"jsx": "react",
		"jsxFactory": "vscpp",
		"jsxFragmentFactory": "vscppf"
	}
}
```

## Differences from VS Code Version

This standalone version:

- ✅ **No VS Code dependencies** - Works in any Node.js environment
- ✅ **Custom tokenizers** - Bring your own token counting logic
- ✅ **All core features** - Prioritization, token budgets, message types
- ❌ **No VS Code integrations** - No built-in language model access
- ❌ **No VS Code types** - Uses standalone type definitions

## API Reference

### Core Functions

#### `renderPrompt(ctor, props, endpoint, tokenizer)`

Renders a prompt component to chat messages.

**Parameters:**

- `ctor`: Prompt component class
- `props`: Component props
- `endpoint`: `{ modelMaxPromptTokens: number }`
- `tokenizer`: Token counting implementation

**Returns:** `Promise<{ messages, tokenCount, metadata, usedContext, references }>`

### Tokenizers

#### `SimpleTokenizer`

Basic word-based token estimation.

```typescript
const tokenizer = new SimpleTokenizer();
```

#### `StandaloneTokenizer`

Custom token counting implementation.

```typescript
const tokenizer = new StandaloneTokenizer(countFunction);
```

### Message Components

#### `SystemMessage`

System-level instructions for the AI.

#### `UserMessage`

User input or questions.

#### `AssistantMessage`

AI assistant responses.

All message components support:

- `priority?: number` - Higher numbers = higher priority
- `children` - Text content or nested components

## Testing

The library includes comprehensive unit tests that verify all standalone functionality:

```bash
npm run test:unit
```

## Migration from VS Code Version

1. Replace VS Code imports with standalone imports
2. Use `SimpleTokenizer` or `StandaloneTokenizer` instead of VS Code's language model
3. Provide endpoint configuration with `modelMaxPromptTokens`
4. Handle the rendered messages in your own language model integration

## License

Same as the original @vscode/prompt-tsx package.
