/**
 * Simple test to check JSX setup
 */

import './src/base/tsx'; // Import tsx setup explicitly
import {
	SystemMessage,
	UserMessage,
	PromptElement,
	BasePromptElementProps,
	renderPrompt,
	SimpleTokenizer,
} from './src/base';

class SimplePrompt extends PromptElement<BasePromptElementProps> {
	render() {
		return (
			<>
				<SystemMessage>Hello from standalone!</SystemMessage>
				<UserMessage>Test message</UserMessage>
			</>
		);
	}
}

async function test() {
	try {
		const tokenizer = new SimpleTokenizer();
		const endpoint = { modelMaxPromptTokens: 1000 };
		const result = await renderPrompt(SimplePrompt, {}, endpoint, tokenizer);
		console.log('Success!', result.messages.length, 'messages');
		console.log('System:', result.messages[0].content);
		console.log('User:', result.messages[1].content);
	} catch (error) {
		console.error('Error:', error.message);
	}
}

test();
