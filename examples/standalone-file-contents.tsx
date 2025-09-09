import {
	BasePromptElementProps,
	PromptElement,
	PromptPiece,
	PromptSizing,
	SystemMessage,
	UserMessage,
} from '../src/base';

interface IFilesToInclude {
	filename: string;
	content: string;
	focusLine?: number;
}

interface IMyPromptProps extends BasePromptElementProps {
	userQuery: string;
	files: IFilesToInclude[];
}

/**
 * Standalone example showing how to use prompt-tsx without VS Code dependencies.
 *
 * This example demonstrates how to include file contents in your prompt using
 * the `flexGrow` property to cooperatively size the file contents to fit within
 * the token budget.
 *
 * The `FileContext` element will grow to fill available space after the system
 * message and user query are rendered.
 */
export class MyPrompt extends PromptElement<IMyPromptProps> {
	render() {
		return (
			<>
				<SystemMessage priority={100}>
					You are a helpful AI assistant. Analyze the provided files and answer the user's question.
				</SystemMessage>
				<UserMessage priority={90}>{this.props.userQuery}</UserMessage>
				<FileContext priority={70} flexGrow={1} files={this.props.files} />
			</>
		);
	}
}

class FileContext extends PromptElement<{ files: IFilesToInclude[] } & BasePromptElementProps> {
	async render(_state: void, sizing: PromptSizing): Promise<PromptPiece> {
		const files = await this.getExpandedFiles(sizing);
		return <>{files.map(f => f.toString())}</>;
	}

	/**
	 * Distributes the token budget across files, expanding each file line by line
	 * until the budget is exhausted. This ensures we stay within the token limit
	 * while including as much relevant context as possible.
	 */
	private async getExpandedFiles(sizing: PromptSizing) {
		const files = this.props.files.map(f => new FileContextTracker(f));

		let tokenCount = 0;
		// Count the base amount of tokens used by the file headers:
		for (const file of files) {
			tokenCount += await file.tokenCount(sizing);
		}

		while (true) {
			let anyHadLinesToExpand = false;
			for (const file of files) {
				const nextLine = file.nextLine();
				if (nextLine === undefined) {
					continue;
				}

				anyHadLinesToExpand = true;
				const nextTokenCount = await sizing.countTokens(nextLine);
				if (tokenCount + nextTokenCount > sizing.tokenBudget) {
					return files;
				}

				file.expand();
				tokenCount += nextTokenCount;
			}

			if (!anyHadLinesToExpand) {
				return files;
			}
		}
	}
}

class FileContextTracker {
	private prefix: string;
	private suffix = '\n```\n';
	private lines: string[] = [];
	private allLines: string[];

	private aboveLine: number;
	private belowLine: number;
	private nextLineIs: 'above' | 'below' | 'none' = 'above';

	constructor(private readonly file: IFilesToInclude) {
		this.prefix = `# ${file.filename}\n\`\`\`\n`;
		this.allLines = file.content.split('\n');
		const focusLine = file.focusLine ?? Math.floor(this.allLines.length / 2);
		this.aboveLine = focusLine;
		this.belowLine = focusLine;
	}

	/** Counts the length of the current file header. */
	public async tokenCount(sizing: PromptSizing) {
		const before = await sizing.countTokens(this.prefix);
		const after = await sizing.countTokens(this.suffix);
		return before + after;
	}

	/** Gets the next line that will be added on the following `expand` call. */
	public nextLine(): string | undefined {
		switch (this.nextLineIs) {
			case 'above':
				return this.aboveLine >= 0 ? this.allLines[this.aboveLine] + '\n' : undefined;
			case 'below':
				return this.belowLine < this.allLines.length
					? this.allLines[this.belowLine] + '\n'
					: undefined;
			case 'none':
				return undefined;
		}
	}

	/** Adds in the 'next line' */
	public expand() {
		if (this.nextLineIs === 'above' && this.aboveLine >= 0) {
			this.lines.unshift(this.allLines[this.aboveLine]);
			if (this.belowLine < this.allLines.length - 1) {
				this.belowLine++;
				this.nextLineIs = 'below';
			} else if (this.aboveLine > 0) {
				this.aboveLine--;
			} else {
				this.nextLineIs = 'none';
			}
		} else if (this.nextLineIs === 'below' && this.belowLine < this.allLines.length) {
			this.lines.push(this.allLines[this.belowLine]);
			if (this.aboveLine > 0) {
				this.aboveLine--;
				this.nextLineIs = 'above';
			} else if (this.belowLine < this.allLines.length - 1) {
				this.belowLine++;
			} else {
				this.nextLineIs = 'none';
			}
		}
	}

	/** Gets the file content as a string. */
	toString() {
		return this.prefix + this.lines.join('\n') + this.suffix;
	}
}
